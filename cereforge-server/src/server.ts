import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';
import { testDatabaseConnection, getDatabaseHealth } from './config/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start server
 */
async function startServer() {
  try {
    logger.info('🚀 Cereforge Server starting...');
    logger.info(`🔧 Environment: ${NODE_ENV}`);

    // Test database connection
    logger.info('🔗 Connecting to database...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      logger.error('❌ Database connection failed');
      process.exit(1);
    }

    // ✅ Get database health stats
    const dbHealth = await getDatabaseHealth();
    logger.info(`✅ Database connected (response time: ${dbHealth.responseTime}ms)`);

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌐 API URL: http://localhost:${PORT}/api/v1`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
      logger.info('');
      logger.info('📊 Performance Optimizations Active:');
      logger.info('   ✅ Connection pooling enabled');
      logger.info('   ✅ Direct email sending (no queue)');
      logger.info('   ✅ Postgres cron for session cleanup');
      logger.info('   ✅ Database indexes optimized');
      logger.info('   ✅ Calendar event caching enabled');
    });

    // ==========================================
    // ✅ GRACEFUL SHUTDOWN
    // ==========================================
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        // ✅ Supabase connections close automatically
        logger.info('✅ Database connections closed');
        
        logger.info('👋 Server shut down complete');
        process.exit(0);
      });

      // Force shutdown after 15 seconds
      setTimeout(() => {
        logger.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 15000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();