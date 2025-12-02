// lib/errors/UnauthorizedError.ts
export class UnauthorizedError extends Error {
  reason: string;
  context?: Record<string, any>;

  constructor(reason: string, context?: Record<string, any>) {
    super(`Unauthorized: ${reason}`);
    this.name = 'UnauthorizedError';
    this.reason = reason;
    this.context = context;
  }
}