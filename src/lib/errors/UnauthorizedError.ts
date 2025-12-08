// lib/errors/UnauthorizedError.ts
export class UnauthorizedError extends Error {
  reason: string;
  context?: Record<string, unknown>;

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Unauthorized: ${reason}`);
    this.name = 'UnauthorizedError';
    this.reason = reason;
    this.context = context;
  }
}