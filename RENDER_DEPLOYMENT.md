# FastPast - Render.com Deployment Guide

## Why Render.com?

✅ **FREE tier available** (no credit card required for free tier)  
✅ **Supports Node.js + Express + Socket.IO**  
✅ **Auto-deploy from GitHub**  
✅ **Free SSL certificate**  
✅ **Better for video downloads** than serverless platforms  

---

## Step 1: Push Your Code to GitHub (Already Done! ✅)

Your code is already at: **https://github.com/pogba-ibra/FastPast**

We need to push the new `render.yaml` file:

```bash
git add render.yaml
git commit -m "Add Render.com configuration"
git remote add origin https://github.com/pogba-ibra/FastPast.git
git push -u origin main
```

---

## Step 2: Set Up MongoDB Atlas (5 minutes)

Your app needs a database. Follow these steps:

### 2.1 Create MongoDB Atlas Account
1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with Google (fastest)
3. Choose **FREE M0 Cluster**

### 2.2 Create Database User
- Go to "Database Access" (left sidebar)
- Click "+ Add New Database User"
- Username: `fastpast_admin`
- Click "Autogenerate Secure Password" and **SAVE THE PASSWORD**
- Privileges: Select "Atlas admin"
- Click "Add User"

### 2.3 Allow Network Access
- Go to "Network Access" (left sidebar)
- Click "+ Add IP Address"
- Click "ALLOW ACCESS FROM ANYWHERE"
- Confirm (IP will be `0.0.0.0/0`)

### 2.4 Get Connection String
- Go to "Database" → Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string:
  ```
  mongodb+srv://fastpast_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- Replace `<password>` with your actual password
- Add `/video-downloader` before the `?`:
  ```
  mongodb+srv://fastpast_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/video-downloader?retryWrites=true&w=majority
  ```
- **SAVE THIS** - you'll need it for Render!

---

## Step 3: Deploy to Render.com (5 minutes)

### 3.1 Sign Up for Render
1. Go to: **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. **Sign up with GitHub** (easier)
4. Authorize Render to access your GitHub

### 3.2 Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect GitHub account"** if needed
4. Find and select your **"FastPast"** repository
5. Click **"Connect"**

### 3.3 Configure Your Service

Render will auto-detect your settings from `render.yaml`, but verify:

- **Name**: `fastpast` (or choose your own)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Plan**: **FREE** (select this!)

Click **"Create Web Service"**

---

## Step 4: Add Environment Variables

After creating the service, Render will start building. While it builds:

1. Go to the **"Environment"** tab (left sidebar)
2. Click **"Add Environment Variable"**
3. Add these variables:

**Required Variables:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://fastpast_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/video-downloader?retryWrites=true&w=majority` |

**Optional (if you have YouTube API key):**

| Key | Value |
|-----|-------|
| `YOUTUBE_API_KEY_1` | Your YouTube API key |

4. Click **"Save Changes"**
5. Render will automatically redeploy with new variables

---

## Step 5: Get Your Live URL

After deployment completes (2-3 minutes):

1. Render automatically creates a URL for you
2. Look at the top of your service page
3. You'll see a URL like:
   ```
   https://fastpast.onrender.com
   ```
4. **Click the URL** to visit your live site! 🎉

---

## Step 6: Submit to Google Search

### 6.1 Google Search Console
1. Go to: **https://search.google.com/search-console**
2. Click "Start now" and sign in
3. Click "Add property"
4. Choose "URL prefix"
5. Enter your Render URL: `https://fastpast.onrender.com`

### 6.2 Verify Ownership (HTML File Method)
1. Google gives you a file like `google1234567890abcdef.html`
2. Download it
3. Put it in your `Web/` folder
4. Run:
   ```bash
   git add Web/google*.html
   git commit -m "Add Google verification"
   git push
   ```
5. Wait for Render to redeploy (1-2 minutes)
6. Click "Verify" in Google Search Console

### 6.3 Submit Sitemap
1. In Search Console, click "Sitemaps"
2. Enter: `sitemap.xml`
3. Click "Submit"

### 6.4 Request Indexing
1. Click "URL Inspection"
2. Enter your homepage URL
3. Click "Request Indexing"

---

## Important Notes

### Free Tier Limitations
⚠️ **Render's free tier**:
- App "spins down" after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month free (enough for most personal projects)

### Keeping It Active
If you want faster response times:
- Upgrade to paid plan ($7/month) for always-on service
- Or use a uptime monitoring service (like UptimeRobot) to ping your site every 10 minutes

---

## Troubleshooting

### "Build Failed"
- Check Render logs for errors
- Verify `package.json` has all dependencies

### "Application Error"
- Check environment variables are set correctly
- Verify MongoDB connection string is correct

### "Cannot connect to database"
- Verify MongoDB Atlas whitelisted `0.0.0.0/0`
- Check connection string has correct password

---

## Cost Summary

- **Render.com**: FREE (with limitations) or $7/month for always-on
- **MongoDB Atlas**: FREE (512MB M0 tier)
- **Domain** (optional): ~$12/year
- **Total**: FREE or ~$7/month

---

## Your Website Will Be:

**Live URL**: `https://fastpast.onrender.com`  
**On Google**: Within 24-48 hours  
**Accessible**: Worldwide  
**Free**: Yes (with spin-down on free tier)  

🚀 **Ready to deploy! Follow Steps 1-6 above.**
