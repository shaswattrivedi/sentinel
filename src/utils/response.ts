import { Request } from "express";

type SuccessResponse<T> = {
  status: "success";
  data: T;
  metadata: { timestamp: string; request_id: string };
};

type ErrorResponse = {
  status: "error";
  error: { code: string; message: string; details?: string };
};

export const success = <T>(req: Request, data: T): SuccessResponse<T> => ({
  status: "success",
  data,
  metadata: {
    timestamp: new Date().toISOString(),
    request_id: (req as Request & { requestId?: string }).requestId ?? ""
  }
});

export const failure = (req: Request, code: string, message: string, details?: string): ErrorResponse => ({
  status: "error",
  error: { code, message, details }
});
