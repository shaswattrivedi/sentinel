import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

export const requestContext = (req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { requestId?: string }).requestId = uuid();
  next();
};
