/**
 * Logging Service
 * 
 * Comprehensive logging system with multiple log levels,
 * contextual information, and formatting.
 * 
 * Created: November 4, 2025
 */

import type { AppError } from './errors';

// ============================================================================
// LOG LEVEL CONSTANTS
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log level names
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

/**
 * ANSI color codes for console output
 */
const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  fatal: '\x1b[35m', // Magenta
};

// ============================================================================
// LOG ENTRY TYPES
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string;
    statusCode?: number;
    stack?: string;
  };
  duration?: number;
  userId?: string;
}

/**
 * Log sink interface - for sending logs to external services
 */
export interface LogSink {
  send(entry: LogEntry): Promise<void>;
  close?(): Promise<void>;
}

/**
 * Console log sink
 */
class ConsoleLogSink implements LogSink {
  async send(entry: LogEntry): Promise<void> {
    const colorCode = this.getColorCode(entry.level);
    const timestamp = entry.timestamp;
    const prefix = `${colorCode}[${timestamp}] ${entry.levelName}${COLORS.reset}`;

    const output = {
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.error && { error: entry.error }),
      ...(entry.duration && { duration: `${entry.duration}ms` }),
    };

    if (import.meta.env.DEV) console.log(`${prefix}:`, output);
  }

  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return COLORS.debug;
      case LogLevel.INFO:
        return COLORS.info;
      case LogLevel.WARN:
        return COLORS.warn;
      case LogLevel.ERROR:
        return COLORS.error;
      case LogLevel.FATAL:
        return COLORS.fatal;
      default:
        return COLORS.reset;
    }
  }
}

/**
 * In-memory log sink (for testing)
 */
export class InMemoryLogSink implements LogSink {
  private logs: LogEntry[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async send(entry: LogEntry): Promise<void> {
    this.logs.push(entry);
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level !== undefined
      ? this.logs.filter(log => log.level >= level)
      : this.logs;
  }

  clear(): void {
    this.logs = [];
  }
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

export class Logger {
  private readonly minLevel: LogLevel;
  private readonly sinks: LogSink[];
  private readonly context: Record<string, unknown>;
  private readonly performanceMarkers: Map<string, number>;
  private userId?: string;

  constructor(options: {
    minLevel?: LogLevel;
    sinks?: LogSink[];
    context?: Record<string, unknown>;
  } = {}) {
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.sinks = options.sinks ?? [new ConsoleLogSink()];
    this.context = options.context ?? {};
    this.performanceMarkers = new Map();
  }

  /**
   * Set user ID for context
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    return new Logger({
      minLevel: this.minLevel,
      sinks: this.sinks,
      context: { ...this.context, ...context },
    });
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log at INFO level
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, error?: Error | AppError, context?: Record<string, unknown>): void {
    this.logError(LogLevel.ERROR, message, error, context);
  }

  /**
   * Log at FATAL level
   */
  fatal(message: string, error?: Error | AppError, context?: Record<string, unknown>): void {
    this.logError(LogLevel.FATAL, message, error, context);
  }

  /**
   * Mark start of performance measurement
   */
  startTimer(label: string): void {
    this.performanceMarkers.set(label, performance.now());
  }

  /**
   * End performance measurement and log
   */
  endTimer(label: string, context?: Record<string, unknown>): number {
    const startTime = this.performanceMarkers.get(label);
    if (startTime === undefined) {
      this.warn(`Performance marker '${label}' not found`);
      return 0;
    }

    const duration = Math.round(performance.now() - startTime);
    this.performanceMarkers.delete(label);

    this.log(
      LogLevel.DEBUG,
      `Performance: ${label}`,
      { duration, ...context },
      { duration }
    );

    return duration;
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    metadata?: { duration?: number }
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      context: { ...this.context, ...context },
      ...(metadata?.duration && { duration: metadata.duration }),
      ...(this.userId && { userId: this.userId }),
    };

    this.sendToSinks(entry);
  }

  /**
   * Log error with proper formatting
   */
  private logError(
    level: LogLevel,
    message: string,
    error?: Error | AppError,
    context?: Record<string, unknown>
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      context: { ...this.context, ...context },
      ...(this.userId && { userId: this.userId }),
    };

    if (error) {
      const errorCode = (error && 'code' in error) ? (error as unknown as Record<string, unknown>).code : undefined;
      const errorStatusCode = (error && 'statusCode' in error) ? (error as unknown as Record<string, unknown>).statusCode : undefined;
      
      entry.error = {
        name: error.name,
        message: error.message,
        ...(error instanceof Error && { stack: error.stack }),
        ...(errorCode && { code: String(errorCode) }),
        ...(errorStatusCode && { statusCode: Number(errorStatusCode) }),
      };
    }

    this.sendToSinks(entry);
  }

  /**
   * Send log entry to all sinks
   */
  private sendToSinks(entry: LogEntry): void {
    this.sinks.forEach(sink => {
      try {
        sink.send(entry).catch(err => {
          if (import.meta.env.DEV) console.error('Error sending log to sink:', err);
        });
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error in log sink:', err);
      }
    });
  }
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

let globalLogger: Logger = new Logger({
  minLevel: LogLevel.INFO,
  sinks: [new ConsoleLogSink()],
});

/**
 * Get global logger instance
 */
export function getLogger(context?: Record<string, unknown>): Logger {
  return context ? globalLogger.child(context) : globalLogger;
}

/**
 * Configure global logger
 */
export function configureLogger(options: {
  minLevel?: LogLevel;
  sinks?: LogSink[];
  context?: Record<string, unknown>;
}): void {
  globalLogger = new Logger(options);
}

/**
 * Set user ID for global logger
 */
export function setLoggerUserId(userId: string): void {
  globalLogger.setUserId(userId);
}

/**
 * Quick logging functions
 */
export const log = {
  debug: (message: string, context?: Record<string, unknown>) =>
    getLogger().debug(message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    getLogger().info(message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    getLogger().warn(message, context),
  error: (message: string, error?: Error | AppError, context?: Record<string, unknown>) =>
    getLogger().error(message, error, context),
  fatal: (message: string, error?: Error | AppError, context?: Record<string, unknown>) =>
    getLogger().fatal(message, error, context),
};

export default {
  Logger,
  LogLevel,
  ConsoleLogSink,
  InMemoryLogSink,
  getLogger,
  configureLogger,
  setLoggerUserId,
  log,
};
