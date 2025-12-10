# 🌱 Seeding Discs to Production Database

This guide explains how to seed discs to your production MongoDB database after deploying to Vercel.

---

## 🎯 Overview

You have **two options** for seeding your production database:

1. **Option 1: Run locally with production environment variables** (Recommended for first-time seeding)
2. **Option 2: Use the secure API route** (Best for ongoing updates)

---

## 📋 Option 1: Run Locally with Production Env Vars

This is the simplest approach for initial seeding. You'll run the seed script on your local machine but connect to your production MongoDB database.

### Step 1: Get Production MongoDB URI

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `MONGODB_URI` in the **Production** environment
5. Copy the value (or click "Reveal" if it's hidden)

**⚠️ Security Note:** Keep this URI secure. Don't commit it to Git or share it publicly.

### Step 2: Create Temporary Environment File

Create a temporary file `.env.production.local` in your project root (this file should be in `.gitignore`):

```bash
# .env.production.local (DO NOT COMMIT THIS FILE)
MONGODB_URI=your_production_mongodb_uri_here
```

**Important:** 
- This file should already be in `.gitignore`
- Delete this file after seeding for security
- Never commit production credentials to Git

### Step 3: Update Seed Script (Temporary)

Temporarily modify `scripts/seed/seedDiscs.ts` to use the production env file:

```typescript
// Change line 2 from:
dotenv.config({ path: '.env.local' });

// To:
dotenv.config({ path: '.env.production.local' });
```

**Or** set the environment variable directly when running:

### Step 4: Run the Seed Script

**Option A: Using npm script with env var:**
```bash
MONGODB_URI="your_production_uri_here" npm run seed
```

**Option B: Using npm script with env file:**
```bash
# After creating .env.production.local and updating the script
npm run seed
```

**Option C: Using ts-node directly:**
```bash
MONGODB_URI="your_production_uri_here" npx ts-node -P tsconfig.seed.json scripts/seed/seedDiscs.ts
```

### Step 5: Verify and Clean Up

1. Check the console output - you should see:
   - `✅ Inserted X new discs` (if new discs were found)
   - `⏩ No new discs to insert` (if all discs already exist)

2. **Delete the temporary `.env.production.local` file** (if you created one)

3. **Revert the seed script** back to using `.env.local` (if you modified it)

4. Verify in your production database that discs were added

---

## 🌐 Option 2: Use Secure API Route

The seed script is also available as a secure API endpoint that requires admin authentication. This is better for ongoing updates.

### Step 1: Ensure You're Logged In as Admin

1. Go to your production site: `https://your-domain.com`
2. Log in with an account that has admin privileges
3. The admin email is set in your Vercel environment variable `ADMIN_EMAIL`

### Step 2: Call the Seed API

**Using curl:**
```bash
curl -X POST https://your-domain.com/api/seed \
  -H "Cookie: your-session-cookie-here"
```

**Using a browser extension (like REST Client or Postman):**
1. Make sure you're logged into your production site in the browser
2. Copy your session cookie from browser DevTools
3. Make a POST request to `https://your-domain.com/api/seed`
4. Include the session cookie in the request headers

**Using browser console (while logged in):**
```javascript
fetch('/api/seed', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Step 3: Verify Response

You should receive a JSON response:
```json
{
  "message": "Seeding completed",
  "inserted": 150,
  "total": 500,
  "existing": 350
}
```

---

## 🔒 Security Notes

### Option 1 (Local with Prod Env Vars):
- ✅ Safe if you delete the temporary env file after use
- ✅ No risk of exposing credentials in API calls
- ⚠️ Requires having production credentials locally (temporarily)

### Option 2 (API Route):
- ✅ No need to store production credentials locally
- ✅ Uses existing admin authentication
- ✅ Can be called from anywhere (once authenticated)
- ⚠️ Requires admin session to be active

---

## 🚨 Troubleshooting

### "MONGODB_URI is not defined"
- Make sure you've set the environment variable correctly
- Check that the env file path matches what the script expects
- Verify the variable name is exactly `MONGODB_URI`

### "Connection timeout" or "Cannot connect to MongoDB"
- Verify your MongoDB Atlas network access allows your IP address
- Check that the connection string is correct
- Ensure the database user has proper permissions

### "Unauthorized" when using API route
- Make sure you're logged in as an admin user
- Verify your session cookie is included in the request
- Check that `ADMIN_EMAIL` in Vercel matches your logged-in email

### "No new discs to insert"
- This is normal if you've already seeded the database
- The script only inserts discs that don't already exist (based on name + brand)

---

## 📊 What Gets Seeded?

The seed script:
1. Fetches disc data from `https://discit-api.fly.dev/disc`
2. Compares against existing discs in your database (by name + brand)
3. Inserts only new discs that don't already exist
4. Includes flight numbers (speed, glide, turn, fade), images, and store links

**Fields populated:**
- `name` - Disc name
- `brand` - Manufacturer
- `type` - Category (from API)
- `stability` - Stability rating
- `flight` - Speed, glide, turn, fade numbers
- `image` - Disc image URL
- `storeLink` - Link to purchase
- `plastic` - Empty (can be filled manually)
- `wearLevel` - Set to 0
- `notes` - Empty

---

## 🔄 Running Multiple Times

The seed script is **idempotent** - you can run it multiple times safely:
- It checks for existing discs before inserting
- Only new discs will be added
- Existing discs won't be duplicated or modified

You can run it:
- After initial deployment
- When new discs are added to the source API
- Periodically to keep your catalog up to date

---

## ✅ Success Checklist

After seeding, verify:
- [ ] Discs appear in your production database
- [ ] Discs are visible in the catalog page
- [ ] Disc images load correctly
- [ ] Flight numbers are populated
- [ ] No duplicate discs were created
- [ ] Temporary env files were deleted (if used)

---

**Last Updated:** January 2025  
**Status:** Ready for Use

