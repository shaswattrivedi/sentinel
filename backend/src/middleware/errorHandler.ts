import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { failure } from "../utils/response.js";

export class HttpError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: string) {
    super(message);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const code = err instanceof HttpError ? err.code : "SYS_500";
  const message = err instanceof HttpError ? err.message : "Internal server error";
  const details = err instanceof HttpError ? err.details : undefined;

  logger.error("request_error", { code, message, details, requestId: (req as Request & { requestId?: string }).requestId });

  res.status(statusCode).json(failure(req, code, message, details));
};
