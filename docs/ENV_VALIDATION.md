# 🔍 Environment Variable Validation Guide

**Last Updated:** January 2025  
**Status:** ✅ Implemented

---

## 📋 Overview

DiscNest now includes comprehensive environment variable validation that runs automatically at startup. This ensures that all required configuration is present and properly formatted before the application starts.

---

## ✅ What's Validated

The validation system checks:

### Required Variables
- ✅ `MONGODB_URI` - Must be valid MongoDB connection string
- ✅ `NEXTAUTH_SECRET` - Must be at least 32 characters
- ✅ `NEXTAUTH_URL` - Must be valid URL (http:// or https://)
- ✅ `CLOUDINARY_CLOUD_NAME` - Required
- ✅ `CLOUDINARY_API_KEY` - Required
- ✅ `CLOUDINARY_API_SECRET` - Required
- ✅ `RESEND_API_KEY` - Must start with "re_"
- ✅ `RESEND_FROM_PROD` - Must be valid email format
- ✅ `RESEND_FROM_DEV` - Must be valid email format
- ✅ `ADMIN_EMAIL` - Must be valid email format
- ✅ `OPENCAGE_API_KEY` - Required

### Optional Variables (with validation if present)
- `GOOGLE_CLIENT_ID` - Only required if using Google OAuth
- `GOOGLE_CLIENT_SECRET` - Only required if using Google OAuth
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Must start with "G-" if set
- `NEXT_PUBLIC_BASE_URL` - Has fallback, so optional

### Conditional Validation
- If `GOOGLE_CLIENT_ID` is set, `GOOGLE_CLIENT_SECRET` must also be set (and vice versa)
- In production, `RESEND_FROM_PROD` must be set
- Warns if using `@resend.dev` email in production

---

## 🔄 How It Works

### Automatic Validation

Validation runs automatically when critical modules are imported:

1. **`src/lib/mongodb.ts`** - Validates on import (used by most API routes)
2. **`src/lib/auth.ts`** - Validates on import (used by NextAuth)

This ensures validation happens early, before any API routes or authentication logic runs.

### Manual Validation

You can also validate manually:

```typescript
import { validateEnv } from '@/lib/env';

// Call this at startup (e.g., in an API route or middleware)
validateEnv();
```

---

## 📝 Usage Examples

### Using Type-Safe Getters

Instead of `process.env.VARIABLE_NAME`, use the type-safe `env` object:

```typescript
import { env } from '@/lib/env';

// Type-safe, validated access
const mongoUri = env.mongodbUri();
const baseUrl = env.baseUrl(); // Has default fallback
const isProd = env.isProduction();

// Optional variables return string | undefined
const gaId = env.gaMeasurementId();
if (gaId) {
  // Use GA tracking
}
```

### Direct Access (Still Validated)

You can still use `process.env` directly - validation ensures the values exist:

```typescript
// This is safe because validateEnv() ensures it exists
const apiKey = process.env.RESEND_API_KEY!;
```

---

## 🚨 Error Messages

When validation fails, you'll see clear error messages:

```
❌ Environment Variable Validation Failed:

❌ Missing required environment variable: MONGODB_URI (MongoDB connection string)
❌ Invalid RESEND_API_KEY: RESEND_API_KEY should start with "re_"
❌ Invalid ADMIN_EMAIL: ADMIN_EMAIL must be a valid email address

💡 Please check your .env.local file or environment variables.
```

---

## 🧪 Testing Validation

### Test Missing Variables

1. Remove a required variable from `.env.local`
2. Start the dev server: `npm run dev`
3. You should see validation errors immediately

### Test Invalid Formats

1. Set `ADMIN_EMAIL=not-an-email` in `.env.local`
2. Start the dev server
3. You should see format validation errors

---

## 📍 Where Validation Runs

Validation is integrated into:

1. **`src/lib/mongodb.ts`** - Runs when database connection is needed
2. **`src/lib/auth.ts`** - Runs when NextAuth is initialized

Since these modules are imported early by API routes, validation happens before any request processing.

---

## ⚙️ Configuration

### Adding New Variables

To add validation for a new environment variable, edit `src/lib/env.ts`:

```typescript
const envVars: EnvVar[] = [
  // ... existing variables
  {
    name: 'NEW_VARIABLE',
    required: true, // or false for optional
    description: 'Description of what this variable does',
    validate: (value) => {
      // Custom validation logic
      if (!value.startsWith('prefix_')) {
        return 'NEW_VARIABLE must start with "prefix_"';
      }
      return true; // Valid
    },
  },
];
```

### Adding Type-Safe Getter

Add to the `env` object in `src/lib/env.ts`:

```typescript
export const env = {
  // ... existing getters
  newVariable: () => getEnv('NEW_VARIABLE'),
};
```

---

## 🔧 Troubleshooting

### "Environment validation failed" Error

**Cause:** Missing or invalid environment variable

**Solution:**
1. Check the error message for which variable is missing/invalid
2. Add it to `.env.local` (development) or Vercel (production)
3. Restart the dev server or redeploy

### Validation Runs Multiple Times

**Cause:** Module is imported multiple times

**Solution:** This is normal and harmless. The validation is fast and idempotent. Module caching ensures the validation logic only runs once per process.

### Validation Not Running

**Cause:** Module with validation isn't being imported

**Solution:** Ensure `mongodb.ts` or `auth.ts` is imported somewhere in your code. They're typically imported by API routes automatically.

---

## 📚 Related Documentation

- [README.md](../README.md) - Environment variable list
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) - Deployment guide
- [DEPLOYMENT_REVIEW.md](./DEPLOYMENT_REVIEW.md) - Pre-deployment checklist
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Email configuration

---

## ✅ Benefits

1. **Early Failure** - Catch missing variables before runtime errors
2. **Clear Errors** - Helpful error messages with descriptions
3. **Format Validation** - Ensures variables are in correct format
4. **Type Safety** - Type-safe getters via `env` object
5. **Conditional Logic** - Validates related variables (e.g., Google OAuth pair)
6. **Environment Awareness** - Different rules for production vs development

---

**Last Updated:** January 2025  
**Status:** Complete and Active
