/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 */

const winston = require('winston');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport for all environments
  new winston.transports.Console(),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  
  // File transport for all logs
  new winston.transports.File({ filename: 'logs/combined.log' }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

// Structured logging methods
const structuredLogger = {
  // HTTP request logging
  logRequest: (req, res, responseTime) => {
    logger.http({
      message: 'HTTP Request',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  },

  // Error logging
  logError: (error, context = {}) => {
    logger.error({
      message: error.message,
      stack: error.stack,
      ...context
    });
  },

  // Database operation logging
  logDatabaseOperation: (operation, collection, duration, success) => {
    logger.info({
      message: 'Database Operation',
      operation,
      collection,
      duration: `${duration}ms`,
      success
    });
  },

  // Authentication logging
  logAuth: (event, userId, success, reason = null) => {
    logger.info({
      message: 'Authentication Event',
      event,
      userId,
      success,
      reason
    });
  },

  // Payment logging
  logPayment: (event, paymentId, amount, status) => {
    logger.info({
      message: 'Payment Event',
      event,
      paymentId,
      amount,
      status
    });
  },

  // Security logging
  logSecurityEvent: (event, severity, details) => {
    logger.warn({
      message: 'Security Event',
      event,
      severity,
      ...details
    });
  },

  // Generic info logging
  info: (message, metadata = {}) => {
    logger.info({ message, ...metadata });
  },

  // Generic warning logging
  warn: (message, metadata = {}) => {
    logger.warn({ message, ...metadata });
  },

  // Generic error logging
  error: (message, metadata = {}) => {
    logger.error({ message, ...metadata });
  },

  // Debug logging (only in development)
  debug: (message, metadata = {}) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug({ message, ...metadata });
    }
  }
};

module.exports = structuredLogger;

