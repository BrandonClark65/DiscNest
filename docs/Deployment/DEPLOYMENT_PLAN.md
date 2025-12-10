# 🚀 DiscNest Deployment Plan

**Project:** DiscNest  
**Target Platform:** Vercel  
**Database:** MongoDB Atlas  
**Date:** January 2025

---

## 📋 Overview

This document provides a step-by-step guide for deploying DiscNest to production. Follow these steps in order to ensure a smooth deployment.

---

## 🎯 Pre-Deployment Requirements

### 1. Fix Critical Issues

Before deploying, address the issues identified in `DEPLOYMENT_REVIEW.md`:

- [ ] Fix environment variable inconsistencies
- [ ] Remove or protect `/api/test-openai` route
- [ ] Remove hardcoded email addresses
- [ ] Add environment variable validation (optional but recommended)

**Estimated Time:** 1-2 hours

---

## 📦 Step 1: Prepare Codebase

### 1.1 Final Code Review

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run E2E tests (if applicable)
npm run test:e2e

# Build production bundle
npm run build
```

**Expected Result:** All commands succeed without errors

### 1.2 Commit and Push

```bash
# Ensure all changes are committed
git status

# Push to main branch
git push origin main
```

---

## 🔐 Step 2: Configure Vercel Project

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

**Branch Strategy:**
- **Production:** `main` branch automatically deploys to production
- **Preview:** All other branches and pull requests create preview deployments
- **Development (Optional):** You can create a `dev` branch and configure it as a Development environment in Vercel settings

**Note:** You don't need separate `prod` and `dev` branches. Vercel automatically:
- Uses `main` for production deployments
- Creates preview URLs for other branches/PRs
- Allows different environment variables per environment (Production, Preview, Development)

### 2.2 Configure Environment Variables

Add all required environment variables in Vercel dashboard. You can set different values for:
- **Production** (main branch)
- **Preview** (other branches/PRs)
- **Development** (if you configure a dev branch)

**Required Variables:**

```bash
# Database
MONGODB_URI=<your_mongodb_atlas_connection_string>

# Authentication
NEXTAUTH_SECRET=<generate_strong_secret_here>
NEXTAUTH_URL=https://www.discnest.com  # Must match Google OAuth redirect URI domain

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>

# Email (Resend)
RESEND_API_KEY=<your_resend_api_key>
RESEND_FROM_PROD=noreply@discnest.com  # Must be verified domain
RESEND_FROM_DEV=onboarding@resend.dev  # For testing

# Admin
ADMIN_EMAIL=<your_admin_email>

# Geocoding
OPENCAGE_API_KEY=<your_opencage_api_key>

# SEO
NEXT_PUBLIC_BASE_URL=https://discnest.com
```

**Optional Variables:**

```bash
# Google OAuth (if using)
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Analytics (if using)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2.3 Generate NEXTAUTH_SECRET

```bash
# Generate a strong secret
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET` in Vercel.

---

## 🌐 Step 3: Configure Domain

### 3.1 Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain: `discnest.com`
3. Add `www.discnest.com` (optional, Vercel will redirect)

### 3.2 Configure DNS

Update your DNS records:

**For Root Domain (discnest.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www (www.discnest.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Alternative (Vercel's recommended):**
Follow Vercel's DNS configuration instructions in the dashboard.

### 3.3 SSL Certificate

Vercel automatically provisions SSL certificates. Wait 1-24 hours for DNS propagation and SSL activation.

---

## 📧 Step 4: Configure Email (Resend)

### 4.1 Verify Domain in Resend

1. Go to [resend.com](https://resend.com)
2. Navigate to Domains
3. Add your domain: `discnest.com`
4. Add DNS records as instructed:
   - SPF record
   - DKIM records
   - DMARC record (optional)

### 4.2 Wait for Verification

Domain verification typically takes a few minutes to 24 hours.

### 4.3 Configure Email Addresses

Once verified, configure:
- `RESEND_FROM_PROD=noreply@discnest.com` (or your preferred address)
- `RESEND_FROM_DEV=onboarding@resend.dev` (for development)

---

## 🗄️ Step 5: Configure MongoDB Atlas

### 5.1 Should You Create a Separate Production Cluster?

**✅ YES - Strongly Recommended**

**Reasons:**
- **Data Isolation:** Prevents accidental data loss from development/testing
- **Performance:** Production workloads won't be affected by dev/testing queries
- **Security:** Separate credentials and network access rules
- **Cost Control:** Can use different tiers for dev vs production
- **Backup Strategy:** Production backups are critical; dev backups are optional

**Best Practice:** Keep development and production databases completely separate.

### 5.2 Cluster Tier Recommendations

**For Production (DiscNest):**

**Recommended: M10 (Dedicated) - $57/month**
- **2 GB RAM, 10 GB storage**
- **Best for:** Small to medium applications, startups, MVP launches
- **Why M10:**
  - Dedicated resources (not shared)
  - Includes automated backups
  - Good performance for typical web app workloads
  - Can handle thousands of users and millions of documents
  - Easy to scale up later if needed

**Alternative: M0 (Free) - $0/month**
- **512 MB RAM, 512 MB storage**
- **Best for:** Testing, very early stage, or extremely low traffic
- **Limitations:**
  - Shared resources (can be slower)
  - No automated backups (manual only)
  - Limited to 512 MB storage
  - Not recommended for production with real users

**Alternative: M30 (Dedicated) - $200/month**
- **8 GB RAM, 40 GB storage**
- **Best for:** High-traffic applications, established businesses
- **When to choose:**
  - You have 10,000+ active users
  - You're processing thousands of queries per second
  - You need guaranteed high performance
  - You have budget for scaling

**Alternative: Serverless (Flex) - Pay per operation**
- **Variable cost based on usage**
- **Best for:** Unpredictable traffic, cost optimization
- **Considerations:**
  - Can be cheaper for low/irregular traffic
  - Can be more expensive for consistent high traffic
  - Good for testing different usage patterns

**Recommendation for DiscNest:**
1. **Start with M10** - Best balance of cost, performance, and features
2. **Monitor usage** - MongoDB Atlas provides metrics dashboard
3. **Scale up to M30** if you see:
   - Consistent high CPU usage (>70%)
   - Slow query performance
   - Storage approaching limits
   - High user growth

### 5.3 Create Production Cluster

1. **In MongoDB Atlas Dashboard:**
   - Click "Create" → "Cluster"
   - Choose **M10** (or your selected tier)
   - Select **same region as Vercel deployment** (e.g., US East if Vercel is in US)
   - Choose **MongoDB 7.0** (or latest stable)
   - Name it: `discnest-production`

2. **Configure Network Access:**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allows all IPs - Vercel uses dynamic IPs)
   - **OR** (more secure): Add specific Vercel IP ranges if available
   - **Note:** For production, consider restricting to known IPs if possible

3. **Create Database User:**
   - Go to Database Access
   - Click "Add New Database User"
   - Username: `discnest-prod` (or your preference)
   - Password: Generate strong password (save securely!)
   - Database User Privileges: "Read and write to any database"
   - **Important:** Save credentials - you'll need them for connection string

### 5.4 Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js, Version: 5.5 or later
4. Copy connection string
5. Replace `<password>` with your database user password
6. **Add database name** (if not already in the string):
   - Your connection string might look like: `mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=...`
   - Add `/discnest` before the `?`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/discnest?appName=...`
   - **Note:** The database name (`/discnest`) is optional but recommended. If omitted, MongoDB will use a default database, but it's better to specify it explicitly.
7. **Optional:** Add `retryWrites=true&w=majority` for better reliability:
   - Final format: `mongodb+srv://discnest-prod:<password>@cluster.mongodb.net/discnest?retryWrites=true&w=majority&appName=discnest-production`

### 5.5 Enable Backups (M10+)

**M10 includes automated backups:**

1. Go to your cluster → "Backup" tab
2. Enable "Cloud Backup" (included with M10)
3. Configure backup schedule:
   - **Snapshot Schedule:** Daily at 2 AM UTC (or your preferred time)
   - **Retention:** 7 days (default, can increase)
4. **Test restore procedure:**
   - Create a test document
   - Perform a restore to verify backups work
   - Document the restore process

**Note:** M0 (Free) tier does NOT include automated backups. You must manually export data.

### 5.6 Development Database (Optional but Recommended)

**Create a separate M0 (Free) cluster for development:**
- Name: `discnest-dev`
- Use for: Local development, testing, staging
- Benefits: No risk of affecting production data
- Cost: Free (M0 tier)

### 5.7 Performance Optimization

1. **Create Indexes:**
   - Index frequently queried fields (e.g., `listings.userId`, `listings.createdAt`)
   - MongoDB Atlas can suggest indexes based on query patterns

2. **Monitor Performance:**
   - Use Atlas Performance Advisor
   - Review slow query logs
   - Monitor connection pool usage

3. **Connection Pooling:**
   - Next.js API routes handle connection pooling automatically
   - Default connection limit is usually sufficient

---

## 🚀 Step 6: Deploy

### 6.1 Initial Deployment

1. In Vercel dashboard, click "Deploy"
2. Monitor build logs
3. Wait for deployment to complete

### 6.2 Verify Deployment

Check the following:

- [ ] Site loads at production URL
- [ ] No console errors in browser
- [ ] Authentication works (login/signup)
- [ ] Database connection works
- [ ] Image uploads work
- [ ] Email sending works (test contact form)
- [ ] API routes respond correctly

---

## ✅ Step 7: Post-Deployment Verification

### 7.1 Functional Testing

Test all major features:

- [ ] User registration
- [ ] User login (email/password)
- [ ] User login (Google OAuth, if configured)
- [ ] Create listing
- [ ] View listings
- [ ] Search/filter listings
- [ ] Send messages
- [ ] Upload images
- [ ] Manage disc bag
- [ ] Contact form
- [ ] Password reset

### 7.2 Performance Testing

- [ ] Page load times (< 3 seconds)
- [ ] Image optimization working
- [ ] Mobile responsiveness
- [ ] Core Web Vitals (use Lighthouse)

### 7.3 SEO Verification

- [ ] Sitemap accessible: `https://discnest.com/sitemap.xml`
- [ ] Robots.txt: `https://discnest.com/robots.txt`
- [ ] Open Graph tags (test with [Facebook Debugger](https://developers.facebook.com/tools/debug/))
- [ ] Structured data (test with [Google Rich Results Test](https://search.google.com/test/rich-results))

### 7.4 Security Checks

- [ ] HTTPS enforced
- [ ] Security headers present (check with [SecurityHeaders.com](https://securityheaders.com))
- [ ] No exposed API keys
- [ ] Admin routes protected
- [ ] Authentication required for protected routes

---

## 📊 Step 8: Set Up Monitoring

### 8.1 Error Monitoring

DiscNest already has error logging to database. Additionally:

- [ ] Set up Vercel error alerts
- [ ] Configure email alerts for critical errors
- [ ] Monitor error logs in MongoDB

### 8.2 Analytics (Optional)

If using Google Analytics:

1. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel
2. Verify tracking in Google Analytics dashboard
3. Set up goals and conversions

### 8.3 Uptime Monitoring

Set up external monitoring:

- [ ] Use service like UptimeRobot or Pingdom
- [ ] Monitor main pages
- [ ] Set up alerts for downtime

---

## 🔍 Step 9: Google Search Console

### 9.1 Submit Site

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://discnest.com`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://discnest.com/sitemap.xml`

### 9.2 Initial Checks

- [ ] Check for crawl errors
- [ ] Review coverage report
- [ ] Test robots.txt
- [ ] Check mobile usability

---

## 🛠️ Step 10: Ongoing Maintenance

### 10.1 Regular Tasks

**Weekly:**
- Review error logs
- Check database performance
- Monitor API usage

**Monthly:**
- Review analytics
- Check for security updates
- Update dependencies
- Review SEO performance

### 10.2 Backup Strategy

- MongoDB Atlas: Automated backups enabled
- Code: Git repository (GitHub/GitLab)
- Images: Cloudinary (automatic)

### 10.3 Update Process

1. Make changes locally
2. Test thoroughly
3. Commit and push to Git
4. Vercel automatically deploys
5. Monitor deployment
6. Verify changes

---

## 🚨 Rollback Procedure

If deployment fails:

### Option 1: Vercel Dashboard

1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Option 2: Git Revert

```bash
# Revert last commit
git revert HEAD
git push origin main
```

Vercel will automatically redeploy.

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] All critical issues fixed
- [ ] Code committed and pushed
- [ ] Tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented

### Vercel Configuration

- [ ] Project created
- [ ] Git repository connected
- [ ] All environment variables set
- [ ] Domain configured
- [ ] DNS records updated

### External Services

- [ ] MongoDB Atlas configured
- [ ] Resend domain verified
- [ ] Cloudinary configured
- [ ] Google OAuth configured (if using)
- [ ] Google Analytics configured (if using)

### Deployment

- [ ] Initial deployment successful
- [ ] Site accessible
- [ ] SSL certificate active
- [ ] All features working

### Post-Deployment

- [ ] Functional testing complete
- [ ] Performance verified
- [ ] SEO verified
- [ ] Security checks passed
- [ ] Monitoring configured
- [ ] Google Search Console submitted

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails:**
- Check build logs in Vercel
- Verify all dependencies in `package.json`
- Check for TypeScript errors

**Environment Variables Not Working:**
- Verify variables are set in Vercel
- Check variable names (case-sensitive)
- Redeploy after adding variables

**Database Connection Fails:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access
- Verify database user permissions

**Email Not Sending:**
- Verify Resend domain is verified
- Check `RESEND_API_KEY` is correct
- Verify `RESEND_FROM_PROD` is set
- Check Resend dashboard for errors

**Images Not Uploading:**
- Verify Cloudinary credentials
- Check file size limits
- Verify CORS settings (if applicable)

**Google OAuth Error 400: redirect_uri_mismatch:**
- **Cause:** The `NEXTAUTH_URL` environment variable doesn't match the redirect URI configured in Google Cloud Console
- **Solution:**
  1. Check your `NEXTAUTH_URL` in Vercel (should be `https://www.discnest.com` or `https://discnest.com`)
  2. Verify the redirect URI in Google Cloud Console matches: `{NEXTAUTH_URL}/api/auth/callback/google`
  3. **Recommended:** Add both redirect URIs to Google Cloud Console for flexibility:
     - `https://www.discnest.com/api/auth/callback/google`
     - `https://discnest.com/api/auth/callback/google`
  4. Also add both JavaScript origins:
     - `https://www.discnest.com`
     - `https://discnest.com`
  5. Update `NEXTAUTH_URL` in Vercel to match your preferred canonical domain
  6. Redeploy after making changes
- **Note:** Changes in Google Cloud Console may take 5 minutes to a few hours to take effect

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Resend Docs:** https://resend.com/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation

---

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ Site is accessible at production URL
2. ✅ All core features work correctly
3. ✅ No critical errors in logs
4. ✅ Performance metrics meet targets
5. ✅ SSL certificate is active
6. ✅ Monitoring is configured
7. ✅ Backups are enabled

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Ready for Use
