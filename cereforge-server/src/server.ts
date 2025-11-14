import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';
import { testDatabaseConnection } from './config/database';

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
    logger.info(`📍 Environment: ${NODE_ENV}`);

    // Test database connection
    logger.info('📡 Connecting to database...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      logger.error('❌ Database connection failed');
      process.exit(1);
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌍 API URL: http://localhost:${PORT}/api/v1`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        // Close database connections, etc.
        // (Supabase client handles this automatically)
        
        logger.info('👋 Server shut down complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();