import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Add colors
  winston.format.colorize({ all: true }),
  // Define format of the message showing the timestamp, the level and the message
  winston.format.printf(info => {
    const message = info.message;
    const splat = info[Symbol.for('splat')];

    if (splat && Array.isArray(splat) && splat.length > 0) {
      // If there are additional arguments, serialize them
      const additionalData = splat
        .map((arg: any) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(' ');
      return `${info.timestamp} ${info.level}: ${message} ${additionalData}`;
    }

    return `${info.timestamp} ${info.level}: ${message}`;
  })
);

// Define transports based on environment
const getTransports = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';

  if (isDevelopment) {
    // Development: only console transport
    return [new winston.transports.Console()];
  } else {
    // Production: console + file transports
    return [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({ filename: 'logs/all.log' }),
    ];
  }
};

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: getTransports(),
});

export default logger;
