import { Resend } from 'resend';
// Environment validation is handled by env.ts (imported via mongodb.ts or auth.ts)
// This ensures RESEND_API_KEY is validated before this module loads

export const resend = new Resend(process.env.RESEND_API_KEY!);
