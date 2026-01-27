import { logger } from "../utils/logger.js";
import { failure } from "../utils/response.js";
export class HttpError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
export const errorHandler = (err, req, res, _next) => {
    const statusCode = err instanceof HttpError ? err.statusCode : 500;
    const code = err instanceof HttpError ? err.code : "SYS_500";
    const message = err instanceof HttpError ? err.message : "Internal server error";
    const details = err instanceof HttpError ? err.details : undefined;
    logger.error("request_error", { code, message, details, requestId: req.requestId });
    res.status(statusCode).json(failure(req, code, message, details));
};
