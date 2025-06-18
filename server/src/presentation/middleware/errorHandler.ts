
import { Request, Response, NextFunction } from 'express';
import { getErrorMessage } from '../../infrastructure/utils/errorHelper';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ Global Error:', err);

  const statusCode = (err as any)?.status || 500;
  const message = getErrorMessage(err);

  res.status(statusCode).json({ message });
}
