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

### 2.2 Configure Environment Variables

Add all required environment variables in Vercel dashboard:

**Required Variables:**

```bash
# Database
MONGODB_URI=<your_mongodb_atlas_connection_string>

# Authentication
NEXTAUTH_SECRET=<generate_strong_secret_here>
NEXTAUTH_URL=https://discnest.com

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

### 5.1 Production Database

1. Create a new cluster in MongoDB Atlas (or use existing)
2. Ensure cluster is in same region as Vercel deployment
3. Configure network access:
   - Add `0.0.0.0/0` for Vercel IPs (or specific Vercel IPs)
   - Or use MongoDB Atlas IP Access List

### 5.2 Database User

1. Create a database user with read/write permissions
2. Update `MONGODB_URI` in Vercel with production connection string
3. Format: `mongodb+srv://username:password@cluster.mongodb.net/discnest?retryWrites=true&w=majority`

### 5.3 Enable Backups

1. Enable automated backups in MongoDB Atlas
2. Configure backup schedule
3. Test restore procedure

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
