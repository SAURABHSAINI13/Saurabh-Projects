// backend/utils/logger.js

/**
 * Structured logger with sensitive field redaction
 * In a production environment, this would be replaced with a proper logging library
 * like winston or pino with appropriate transports and log levels
 */

// Fields that should be redacted in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'authorization',
  'accessToken',
  'refreshToken',
  'creditCard',
  'ssn',
  'socialSecurity',
  'apiKey'
];

// Function to redact sensitive fields
const redactSensitiveFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in result) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      result[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object') {
      result[key] = redactSensitiveFields(result[key]);
    }
  }
  
  return result;
};

// Format log entry as JSON string
const formatLogEntry = (level, data) => {
  const timestamp = new Date().toISOString();
  const redactedData = redactSensitiveFields(data);
  
  return JSON.stringify({
    timestamp,
    level,
    ...redactedData
  });
};

// Logger implementation
export const logger = {
  info: (data) => {
    console.log(formatLogEntry('info', data));
  },
  
  warn: (data) => {
    console.warn(formatLogEntry('warn', data));
  },
  
  error: (data) => {
    console.error(formatLogEntry('error', data));
  },
  
  debug: (data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLogEntry('debug', data));
    }
  },
  
  // Audit logs for security-relevant events
  audit: (data) => {
    const auditData = {
      ...data,
      audit: true
    };
    console.log(formatLogEntry('audit', auditData));
    
    // In a production system, audit logs would be written to a separate
    // append-only store or secure logging service
  }
};