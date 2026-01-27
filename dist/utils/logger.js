const levelOrder = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};
const currentLevel = process.env.LOG_LEVEL ?? "info";
const shouldLog = (level) => levelOrder[level] <= levelOrder[currentLevel];
export const logger = {
    error: (message, meta) => {
        if (shouldLog("error"))
            console.error(message, meta ?? "");
    },
    warn: (message, meta) => {
        if (shouldLog("warn"))
            console.warn(message, meta ?? "");
    },
    info: (message, meta) => {
        if (shouldLog("info"))
            console.info(message, meta ?? "");
    },
    debug: (message, meta) => {
        if (shouldLog("debug"))
            console.debug(message, meta ?? "");
    }
};
