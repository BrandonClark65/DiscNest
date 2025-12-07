/**
 * Environment Variable Validation
 * 
 * This module validates all required environment variables at startup.
 * It throws clear errors if any required variables are missing, helping
 * catch configuration issues early.
 * 
 * Usage:
 *   import { validateEnv } from '@/lib/env';
 *   validateEnv(); // Call this early in your application
 */

type EnvVar = {
  name: string;
  required: boolean;
  description?: string;
  validate?: (value: string) => boolean | string; // Return true if valid, or error message if invalid
};

const envVars: EnvVar[] = [
  // Database
  {
    name: 'MONGODB_URI',
    required: true,
    description: 'MongoDB connection string',
    validate: (value) => {
      if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
        return 'MONGODB_URI must start with mongodb:// or mongodb+srv://';
      }
      return true;
    },
  },

  // Authentication
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js secret for JWT encryption',
    validate: (value) => {
      if (value.length < 32) {
        return 'NEXTAUTH_SECRET should be at least 32 characters long for security';
      }
      return true;
    },
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Base URL of your application',
    validate: (value) => {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'NEXTAUTH_URL must start with http:// or https://';
      }
      return true;
    },
  },

  // Cloudinary (Image Storage)
  {
    name: 'CLOUDINARY_CLOUD_NAME',
    required: true,
    description: 'Cloudinary cloud name',
  },
  {
    name: 'CLOUDINARY_API_KEY',
    required: true,
    description: 'Cloudinary API key',
  },
  {
    name: 'CLOUDINARY_API_SECRET',
    required: true,
    description: 'Cloudinary API secret',
  },

  // Email (Resend)
  {
    name: 'RESEND_API_KEY',
    required: true,
    description: 'Resend API key for sending emails',
    validate: (value) => {
      if (!value.startsWith('re_')) {
        return 'RESEND_API_KEY should start with "re_"';
      }
      return true;
    },
  },
  {
    name: 'RESEND_FROM_PROD',
    required: true,
    description: 'Production email sender (must be from verified domain). Can be "email@domain.com" or "Display Name <email@domain.com>"',
    validate: (value) => {
      if (!value) return 'RESEND_FROM_PROD is required';
      // Support both formats: "email@domain.com" or "Display Name <email@domain.com>"
      const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const displayNameEmailRegex = /^.+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
      if (!simpleEmailRegex.test(value.trim()) && !displayNameEmailRegex.test(value.trim())) {
        return 'RESEND_FROM_PROD must be a valid email address (e.g., "email@domain.com" or "Display Name <email@domain.com>")';
      }
      return true;
    },
  },
  {
    name: 'RESEND_FROM_DEV',
    required: true,
    description: 'Development email sender (can use onboarding@resend.dev). Can be "email@domain.com" or "Display Name <email@domain.com>"',
    validate: (value) => {
      if (!value) return 'RESEND_FROM_DEV is required';
      // Support both formats: "email@domain.com" or "Display Name <email@domain.com>"
      const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const displayNameEmailRegex = /^.+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
      if (!simpleEmailRegex.test(value.trim()) && !displayNameEmailRegex.test(value.trim())) {
        return 'RESEND_FROM_DEV must be a valid email address (e.g., "email@domain.com" or "Display Name <email@domain.com>")';
      }
      return true;
    },
  },

  // Admin
  {
    name: 'ADMIN_EMAIL',
    required: true,
    description: 'Admin email for receiving notifications and contact form submissions. Can be "email@domain.com" or "Display Name <email@domain.com>"',
    validate: (value) => {
      if (!value) return 'ADMIN_EMAIL is required';
      // Support both formats: "email@domain.com" or "Display Name <email@domain.com>"
      const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const displayNameEmailRegex = /^.+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
      if (!simpleEmailRegex.test(value.trim()) && !displayNameEmailRegex.test(value.trim())) {
        return 'ADMIN_EMAIL must be a valid email address (e.g., "email@domain.com" or "Display Name <email@domain.com>")';
      }
      return true;
    },
  },
  {
    name: 'FROM_ALERT_EMAIL',
    required: false,
    description: 'From email address for alert notifications (error alerts, listing reviews, etc.). Falls back to RESEND_FROM_PROD/RESEND_FROM_DEV if not set. Can be "email@domain.com" or "Display Name <email@domain.com>"',
    validate: (value) => {
      // Only validate format if value is provided (it's optional)
      if (value && value.trim()) {
        // Support both formats: "email@domain.com" or "Display Name <email@domain.com>"
        const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const displayNameEmailRegex = /^.+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
        if (!simpleEmailRegex.test(value.trim()) && !displayNameEmailRegex.test(value.trim())) {
          return 'FROM_ALERT_EMAIL must be a valid email address (e.g., "email@domain.com" or "Display Name <email@domain.com>")';
        }
      }
      return true;
    },
  },

  // Geocoding
  {
    name: 'OPENCAGE_API_KEY',
    required: true,
    description: 'OpenCage API key for reverse geocoding',
  },

  // SEO
  {
    name: 'NEXT_PUBLIC_BASE_URL',
    required: false, // Has fallback in code
    description: 'Base URL for SEO metadata (falls back to https://discnest.com)',
  },

  // Optional - Google OAuth
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID (optional, only if using Google login)',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret (optional, only if using Google login)',
  },

  // Optional - Analytics
  {
    name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    required: false,
    description: 'Google Analytics 4 measurement ID (optional)',
    validate: (value) => {
      if (value && !value.startsWith('G-')) {
        return 'NEXT_PUBLIC_GA_MEASUREMENT_ID should start with "G-"';
      }
      return true;
    },
  },
];

/**
 * Validates all environment variables
 * @throws Error if any required variable is missing or invalid
 */
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];
    const isEmpty = !value || value.trim() === '';

    // Check if required variable is missing or empty
    if (envVar.required && isEmpty) {
      errors.push(
        `❌ Missing required environment variable: ${envVar.name}${envVar.description ? ` (${envVar.description})` : ''}`
      );
      continue;
    }

    // Skip validation if variable is optional and not set
    if (!envVar.required && isEmpty) {
      continue;
    }

    // Run custom validation if provided and value exists
    if (!isEmpty && envVar.validate) {
      const validationResult = envVar.validate(value);
      if (validationResult !== true) {
        const errorMsg = typeof validationResult === 'string' ? validationResult : 'Invalid format';
        errors.push(`❌ Invalid ${envVar.name}: ${errorMsg}`);
      }
    }
  }

  // Check for conditional requirements
  // If GOOGLE_CLIENT_ID is set, GOOGLE_CLIENT_SECRET must also be set
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('❌ GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set');
  }
  if (process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_ID) {
    errors.push('❌ GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set');
  }

  // Check environment-specific requirements
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    // In production, ensure production email is set
    if (!process.env.RESEND_FROM_PROD) {
      errors.push('❌ RESEND_FROM_PROD is required in production environment');
    }
    // Warn if using development email in production
    if (process.env.RESEND_FROM_PROD?.includes('resend.dev')) {
      warnings.push('⚠️  Using @resend.dev email in production. Consider using a verified domain.');
    }
  }

  // Display warnings (non-blocking)
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    warnings.forEach((warning) => console.warn(warning));
    console.warn('');
  }

  // Throw error if any required variables are missing or invalid
  // In production, fail hard. In development, warn but allow startup (for easier local dev)
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    errors.forEach((error) => console.error(error));
    console.error('\n💡 Please check your .env.local file or environment variables.\n');
    
    // In production, fail hard to catch issues early
    // In development, warn but allow startup (some vars may be optional for local dev)
    if (nodeEnv === 'production') {
      throw new Error(
        `Environment validation failed: ${errors.length} error(s). See console for details.`
      );
    } else {
      // Development: warn but don't block
      console.warn('⚠️  Continuing in development mode despite validation errors. Fix these before deploying to production.\n');
    }
  }

  // Validation complete - all required variables are present and valid
}

/**
 * Get a validated environment variable
 * Use this instead of process.env directly for better type safety
 */
export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is not set and no default value provided`);
  }
  return value || defaultValue!;
}

/**
 * Type-safe environment variable getters
 * These provide autocomplete and type safety
 */
export const env = {
  // Database
  mongodbUri: () => getEnv('MONGODB_URI'),
  
  // Auth
  nextAuthSecret: () => getEnv('NEXTAUTH_SECRET'),
  nextAuthUrl: () => getEnv('NEXTAUTH_URL'),
  
  // Cloudinary
  cloudinaryCloudName: () => getEnv('CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: () => getEnv('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: () => getEnv('CLOUDINARY_API_SECRET'),
  
  // Email
  resendApiKey: () => getEnv('RESEND_API_KEY'),
  resendFromProd: () => getEnv('RESEND_FROM_PROD'),
  resendFromDev: () => getEnv('RESEND_FROM_DEV'),
  adminEmail: () => getEnv('ADMIN_EMAIL'),
  fromAlertEmail: () => process.env.FROM_ALERT_EMAIL,
  
  // Geocoding
  opencageApiKey: () => getEnv('OPENCAGE_API_KEY'),
  
  // SEO
  baseUrl: () => getEnv('NEXT_PUBLIC_BASE_URL', 'https://discnest.com'),
  
  // Optional
  googleClientId: () => process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
  gaMeasurementId: () => process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  
  // Node environment
  nodeEnv: () => process.env.NODE_ENV || 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
};
