import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  logger.info(`====================================================`);
  logger.info(`  INTELLIDECISION AI SERVER STARTED`);
  logger.info(`  Port: ${PORT}`);
  logger.info(`  Environment: ${config.env}`);
  logger.info(`  Base API: http://localhost:${PORT}/api/v1`);
  logger.info(`====================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('[Server] SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    logger.info('[Server] Process terminated.');
  });
});

process.on('SIGINT', () => {
  logger.info('[Server] SIGINT received. Shutting down...');
  server.close(() => {
    logger.info('[Server] Process terminated.');
  });
});
