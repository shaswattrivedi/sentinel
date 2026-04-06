type LogLevel = "error" | "warn" | "info" | "debug";

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

const shouldLog = (level: LogLevel) => levelOrder[level] <= levelOrder[currentLevel];

export const logger = {
  error: (message: string, meta?: unknown) => {
    if (shouldLog("error")) console.error(message, meta ?? "");
  },
  warn: (message: string, meta?: unknown) => {
    if (shouldLog("warn")) console.warn(message, meta ?? "");
  },
  info: (message: string, meta?: unknown) => {
    if (shouldLog("info")) console.info(message, meta ?? "");
  },
  debug: (message: string, meta?: unknown) => {
    if (shouldLog("debug")) console.debug(message, meta ?? "");
  }
};
