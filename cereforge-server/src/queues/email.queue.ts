import Bull from 'bull';
import IORedis from 'ioredis';
import {
    sendPartnerApplicationNotification,
    sendClientConfirmationEmail
} from '../services/email.service';
import {
    auditTeamNotificationQueued,
    auditClientConfirmationQueued,
    auditTeamNotificationSent,
    auditClientConfirmationSent,
    auditTeamNotificationFailed,
    auditClientConfirmationFailed
} from '../services/audit.email.service';
import logger from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    logger.error('REDIS_URL not configured in environment variables');
    throw new Error('REDIS_URL must be defined');
}

// Parse Redis URL
const url = new URL(REDIS_URL);

// ✅ OPTIMIZED: Minimal Redis calls configuration
const baseConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    username: url.username || 'default',
    password: url.password,
    tls: {
        rejectUnauthorized: false
    },
    family: 4,
    connectTimeout: 10000,
    lazyConnect: false,
    retryStrategy: (times: number) => {
        if (times > 3) {
            logger.error('Redis max retries reached');
            return null;
        }
        return Math.min(times * 500, 2000);
    }
};

// ✅ CRITICAL: Optimized Redis client factory
const createRedisClient = (type?: string) => {
    if (type === 'bclient' || type === 'subscriber') {
        return new IORedis({
            ...baseConfig,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            enableOfflineQueue: true
        });
    }

    return new IORedis({
        ...baseConfig,
        maxRetriesPerRequest: null,
        enableOfflineQueue: true
    });
};

// ✅ OPTIMIZED: Drastically reduced polling and checks
export const emailQueue = new Bull('email-notifications', {
    createClient: createRedisClient,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: true, // ✅ Auto-cleanup completed jobs
        removeOnFail: false
    },
    settings: {
        // ✅ CRITICAL: Reduce Redis polling frequency
        lockDuration: 300000,     // 5 minutes (default: 30 seconds)
        stalledInterval: 300000,  // Check stalled jobs every 5 minutes (default: 30 seconds)
        maxStalledCount: 1,       // Fail after 1 stall (default: 1)
        guardInterval: 300000,    // Check delayed jobs every 5 minutes (default: 5 seconds)
        retryProcessDelay: 5000,  // Wait 5 seconds before retrying (default: 5 seconds)
        
        // ✅ Disable unnecessary checks
        drainDelay: 300            // Delay between processing jobs (reduces polling)
    }
});

// Connection event handlers
emailQueue.on('error', (error) => {
    logger.error('Email queue error:', error);
});

emailQueue.on('waiting', (jobId) => {
    logger.debug(`Job ${jobId} is waiting`);
});

emailQueue.on('active', (job) => {
    logger.debug(`Job ${job.id} is now active`);
});

emailQueue.on('completed', async (job) => {
    logger.info(`Email job ${job.id} completed successfully`);

    const { type, data } = job.data;

    if (type === 'team-notification') {
        await auditTeamNotificationSent(
            data.applicationId,
            job.id
        );
    } else if (type === 'client-confirmation') {
        await auditClientConfirmationSent(
            data.applicationId,
            job.id,
            data.email
        );
    }
});

emailQueue.on('failed', async (job, err) => {
    logger.error(`Email job ${job?.id} failed after all retries:`, err);

    if (job) {
        const { type, data } = job.data;

        if (type === 'team-notification') {
            await auditTeamNotificationFailed(
                data.applicationId,
                job.id,
                err.message,
                job.attemptsMade
            );
        } else if (type === 'client-confirmation') {
            await auditClientConfirmationFailed(
                data.applicationId,
                job.id,
                data.email,
                err.message,
                job.attemptsMade
            );
        }
    }
});

// ✅ OPTIMIZED: Process jobs with concurrency limit
emailQueue.process('team-notification', 1, async (job) => {
    const { data } = job.data;

    logger.info(`Processing team notification email job ${job.id}`);

    try {
        const success = await sendPartnerApplicationNotification(data);

        if (!success) {
            throw new Error('Team notification email sending failed');
        }

        logger.info(`Team notification email sent successfully for job ${job.id}`);
        return { success: true, type: 'team-notification' };
    } catch (error) {
        logger.error(`Team notification job ${job.id} failed:`, error);
        throw error;
    }
});

emailQueue.process('client-confirmation', 1, async (job) => {
    const { data } = job.data;

    logger.info(`Processing client confirmation email job ${job.id}`);

    try {
        const success = await sendClientConfirmationEmail(
            data.email,
            data.fullName,
            data.companyName,
            data.projectTitle
        );

        if (!success) {
            throw new Error('Client confirmation email sending failed');
        }

        logger.info(`Client confirmation email sent successfully for job ${job.id}`);
        return { success: true, type: 'client-confirmation' };
    } catch (error) {
        logger.error(`Client confirmation job ${job.id} failed:`, error);
        throw error;
    }
});

// Helper functions
export async function queueTeamNotification(data: {
    fullName: string;
    email: string;
    companyName: string;
    projectTitle: string;
    applicationId: string;
}): Promise<void> {
    try {
        const job = await emailQueue.add(
            'team-notification',
            { type: 'team-notification', data },
            { priority: 1 }
        );

        logger.info(`Queued team notification for ${data.companyName} (Job ID: ${job.id})`);

        await auditTeamNotificationQueued(
            data.applicationId,
            job.id,
            data.companyName,
            data.projectTitle
        );
    } catch (error) {
        logger.error('Failed to queue team notification:', error);
        throw error;
    }
}

export async function queueClientConfirmation(data: {
    email: string;
    fullName: string;
    companyName: string;
    projectTitle: string;
    applicationId: string;
}): Promise<void> {
    try {
        const job = await emailQueue.add(
            'client-confirmation',
            { type: 'client-confirmation', data },
            { priority: 2 }
        );

        logger.info(`Queued client confirmation for ${data.email} (Job ID: ${job.id})`);

        await auditClientConfirmationQueued(
            data.applicationId,
            job.id,
            data.email,
            data.fullName,
            data.companyName
        );
    } catch (error) {
        logger.error('Failed to queue client confirmation:', error);
        throw error;
    }
}

/**
 * Graceful shutdown
 */
export async function closeEmailQueue(): Promise<void> {
    logger.info('Closing email queue...');

    try {
        await emailQueue.close();
        logger.info('✅ Email queue closed successfully');
    } catch (error) {
        logger.error('❌ Error closing email queue:', error);
        throw error;
    }
}

logger.info('✅ Email queue initialized with optimized settings (low Redis usage)');