# 📧 Email Configuration Guide - RESEND_FROM_PROD & RESEND_FROM_DEV

**Last Updated:** January 2025  
**Service:** Resend API

---

## 📋 Overview

DiscNest uses **Resend** for sending transactional emails (message notifications, contact form submissions, password resets, etc.). The application automatically selects the appropriate sender email address based on the environment (`NODE_ENV`).

---

## 🔑 Environment Variables

### `RESEND_FROM_PROD` (Production)

**Required:** Yes (for production deployments)  
**Format:** `email@yourdomain.com`  
**Example:** `noreply@discnest.com`

**When Used:**
- Automatically selected when `NODE_ENV=production`
- Used for all outgoing emails in production environment

**Requirements:**
- ✅ Must be from a **verified domain** in Resend
- ✅ Domain must have DNS records configured (SPF, DKIM)
- ✅ Domain verification must be completed before use

**Setup Steps:**
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain (e.g., `discnest.com`)
3. Add DNS records as instructed:
   - SPF record
   - DKIM records (usually 2-3 records)
   - DMARC record (optional but recommended)
4. Wait for verification (usually minutes to 24 hours)
5. Once verified, use any email from that domain: `noreply@discnest.com`, `alerts@discnest.com`, etc.

---

### `RESEND_FROM_DEV` (Development)

**Required:** Yes (for local development)  
**Format:** `email@resend.dev` or `email@yourdomain.com`  
**Example:** `onboarding@resend.dev`

**When Used:**
- Automatically selected when `NODE_ENV=development` or `NODE_ENV=test`
- Used for all outgoing emails in development/testing environments

**Requirements:**
- ✅ Can use Resend's sandbox domain (`@resend.dev`) - **no verification needed**
- ✅ Or use your verified domain (same as production)
- ✅ Sandbox emails are limited to 100 emails/day

**Setup Steps:**
1. **Option A (Easiest):** Use Resend's sandbox
   ```
   RESEND_FROM_DEV=onboarding@resend.dev
   ```
   - Works immediately, no setup required
   - Limited to 100 emails/day
   - Perfect for development/testing

2. **Option B:** Use your verified domain
   ```
   RESEND_FROM_DEV=dev@discnest.com
   ```
   - Requires domain verification (same as production)
   - No email limits
   - Use if you need more than 100 emails/day in development

---

## 🔄 How It Works

The application automatically selects the correct sender email based on `NODE_ENV`:

```typescript
// From src/lib/messages/sendMessageNotification.ts
const fromEmail =
  process.env.NODE_ENV === "production"
    ? process.env.RESEND_FROM_PROD!
    : process.env.RESEND_FROM_DEV!;
```

**Flow:**
1. Application checks `NODE_ENV`
2. If `production` → uses `RESEND_FROM_PROD`
3. If `development` or `test` → uses `RESEND_FROM_DEV`
4. If variable is missing → logs error and skips email

---

## 📍 Where These Variables Are Used

### 1. Message Notifications
**File:** `src/lib/messages/sendMessageNotification.ts`  
**Purpose:** Sends email notifications when users receive new messages  
**Uses:** `RESEND_FROM_PROD` or `RESEND_FROM_DEV`

### 2. Contact Form
**File:** `src/app/api/contact/route.ts`  
**Purpose:** Sends contact form submissions to admin  
**Uses:** `RESEND_FROM_PROD` or `RESEND_FROM_DEV`

### 3. Password Reset (if implemented)
**Files:** `src/app/api/auth/reset-password/route.ts`  
**Purpose:** Sends password reset emails  
**Uses:** `RESEND_FROM_PROD` or `RESEND_FROM_DEV`

### 4. Listing Review Alerts (if implemented)
**File:** `src/app/api/listings/route.ts`  
**Purpose:** Alerts admin when listings need review  
**Uses:** `RESEND_FROM_PROD` or `RESEND_FROM_DEV` (via `FROM_ALERT_EMAIL` fallback)

---

## ⚙️ Configuration Examples

### Development (.env.local)

```bash
# Development email (sandbox - no verification needed)
RESEND_FROM_DEV=onboarding@resend.dev

# Production email (will be used when deployed)
RESEND_FROM_PROD=noreply@discnest.com
```

### Production (Vercel Environment Variables)

```bash
# Production email (must be from verified domain)
RESEND_FROM_PROD=noreply@discnest.com

# Development email (for preview deployments)
RESEND_FROM_DEV=onboarding@resend.dev
```

---

## ✅ Verification Checklist

### For Production (`RESEND_FROM_PROD`)

- [ ] Domain added to Resend dashboard
- [ ] DNS records added (SPF, DKIM)
- [ ] Domain verification status: ✅ Verified
- [ ] `RESEND_FROM_PROD` set in Vercel
- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)

### For Development (`RESEND_FROM_DEV`)

- [ ] `RESEND_FROM_DEV` set in `.env.local`
- [ ] Using `@resend.dev` domain OR verified domain
- [ ] Test email sent successfully
- [ ] Email received in inbox

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: "RESEND_FROM_PROD or RESEND_FROM_DEV not configured"

**Error Message:**
```
RESEND_FROM_PROD or RESEND_FROM_DEV not configured
```

**Solution:**
1. Check that the environment variable is set
2. Verify variable name spelling (case-sensitive)
3. Restart development server after adding to `.env.local`
4. Redeploy after adding to Vercel

---

### Issue 2: Emails Not Sending in Production

**Symptoms:**
- No error in logs
- Emails not received
- No bounce notifications

**Possible Causes:**
1. **Domain not verified**
   - Check Resend dashboard → Domains
   - Verify DNS records are correct
   - Wait for verification to complete

2. **Wrong email format**
   - Must be: `email@verified-domain.com`
   - Cannot use unverified domains

3. **DNS records incorrect**
   - Verify SPF record format
   - Check DKIM records (usually 2-3 records)
   - Ensure TTL has propagated

**Solution:**
1. Check Resend dashboard for domain status
2. Verify DNS records using DNS checker tools
3. Test with Resend's test email feature
4. Check Resend logs for delivery status

---

### Issue 3: Emails Going to Spam

**Symptoms:**
- Emails sent successfully
- Emails in spam folder
- Low deliverability

**Solutions:**
1. **Add DMARC record** (recommended)
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:admin@discnest.com
   ```

2. **Verify SPF record**
   - Must include Resend's servers
   - Format: `v=spf1 include:resend.com ~all`

3. **Check DKIM records**
   - All DKIM records must be present
   - Values must match Resend's provided values

4. **Warm up domain** (for new domains)
   - Start with low email volume
   - Gradually increase over time
   - Monitor bounce rates

---

### Issue 4: Sandbox Limit Reached (Development)

**Error:**
```
Daily email limit exceeded
```

**Solution:**
1. Wait 24 hours for limit reset, OR
2. Verify your domain and use `RESEND_FROM_DEV=dev@yourdomain.com`
3. Use verified domain for unlimited emails

---

## 📚 Additional Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend Dashboard:** https://resend.com/domains
- **DNS Record Checker:** https://mxtoolbox.com/
- **Email Deliverability Guide:** https://resend.com/docs/dashboard/domains/introduction

---

## 🔗 Related Documentation

- [README.md](../README.md) - Main project documentation
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) - Deployment guide with email setup
- [DEPLOYMENT_REVIEW.md](./DEPLOYMENT_REVIEW.md) - Pre-deployment checklist

---

## 📝 Quick Reference

| Variable | Environment | Required | Verification Needed |
|----------|-------------|----------|---------------------|
| `RESEND_FROM_PROD` | `production` | ✅ Yes | ✅ Yes (domain) |
| `RESEND_FROM_DEV` | `development`, `test` | ✅ Yes | ❌ No (if using `@resend.dev`) |

**Default Sandbox Email:** `onboarding@resend.dev` (works immediately, 100 emails/day limit)

---

**Last Updated:** January 2025  
**Status:** Complete
