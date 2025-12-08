/**
 * Shared types for API route handlers
 */

export interface UserSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

export interface AdminSession extends UserSession {
  user: UserSession['user'] & {
    role: 'admin';
  };
}
