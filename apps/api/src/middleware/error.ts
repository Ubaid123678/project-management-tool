import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  return res.status(500).json({
    code: "server_error",
    message: "Unexpected server error",
    details: error.message
  });
};
