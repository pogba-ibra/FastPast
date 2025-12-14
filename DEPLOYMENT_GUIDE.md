# FastPast - Railway.app Deployment Guide

This guide will help you deploy FastPast to Railway.app in just a few minutes.

## Prerequisites

- Railway.app account (free to create at [railway.app](https://railway.app))
- GitHub account (optional, but recommended)
- MongoDB Atlas account (for database hosting)

## Step 1: Set Up MongoDB Atlas (Free Cloud Database)

Since Railway won't have a local MongoDB, you'll need a cloud database:

1. **Go to** [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Sign up** for a free account
3. **Create a free cluster** (M0 Sandbox - Free tier)
4. **Create database user**:
   - Click "Database Access" → "Add New Database User"
   - Username: `fastpast`
   - Password: (generate a strong password - save it!)
   - User Privileges: "Read and write to any database"
5. **Whitelist all IPs**:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" → Add `0.0.0.0/0`
   - This allows Railway to connect
6. **Get your connection string**:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string, it looks like:
   ```
   mongodb+srv://fastpast:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Save this for later!

## Step 2: Deploy to Railway

### Option A: Deploy via GitHub (Recommended)

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - FastPast video downloader"
   ```

2. **Create GitHub repository**:
   - Go to [github.com/new](https://github.com/new)
   - Create a new repository (public or private)
   - Follow instructions to push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/fastpast.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Login" and sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your FastPast repository
   - Railway will automatically detect your Node.js app!

### Option B: Deploy via Railway CLI (Alternative)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize and deploy**:
   ```bash
   railway init
   railway up
   ```

## Step 3: Configure Environment Variables

After deploying, you need to set environment variables:

1. **Go to your Railway project dashboard**
2. **Click on your service** → "Variables" tab
3. **Add the following variables** (click "+ New Variable" for each):

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://fastpast:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/video-downloader?retryWrites=true&w=majority
   YOUTUBE_API_KEY_1=YOUR_YOUTUBE_API_KEY
   PORT=3000
   ```

   **Optional YouTube API Keys** (for better rate limits):
   ```
   YOUTUBE_API_KEY_2=your_second_key
   YOUTUBE_API_KEY_3=your_third_key
   ```

4. **Click "Deploy"** to restart with new variables

## Step 4: Install yt-dlp on Railway

Railway doesn't come with yt-dlp pre-installed. You'll need to add it:

1. **Create a `nixpacks.toml` file** in your project root:
   ```toml
   [phases.setup]
   aptPkgs = ['python3', 'python3-pip']

   [phases.install]
   cmds = ['pip3 install yt-dlp']
   ```

2. **Commit and push**:
   ```bash
   git add nixpacks.toml
   git commit -m "Add yt-dlp dependency"
   git push
   ```

Railway will automatically redeploy with yt-dlp installed!

## Step 5: Get Your Live URL

1. **Go to Settings** → "Domains"
2. **Click "Generate Domain"** - Railway will give you a free URL like:
   ```
   https://fastpast-production.up.railway.app
   ```
3. **Your site is now live!** 🎉

### Optional: Add Custom Domain

1. Buy a domain from Namecheap, GoDaddy, etc.
2. In Railway: Settings → Domains → "Custom Domain"
3. Follow DNS instructions to point your domain to Railway

## Step 6: Configure CORS for Production

Update the allowed origins in your deployed app to include your Railway URL.

## Troubleshooting

### Issue: "Cannot find module 'yt-dlp'"
**Solution**: Make sure you created the `nixpacks.toml` file and redeployed.

### Issue: "MongoDB connection timeout"
**Solution**: 
- Verify your MongoDB Atlas connection string is correct
- Make sure you whitelisted `0.0.0.0/0` in Network Access
- Check that your database user has correct permissions

### Issue: "Application failed to respond"
**Solution**: Check the logs in Railway dashboard → "Deployments" → Click on latest deployment → View logs

### Issue: Downloads not working
**Solution**: 
- Check Railway logs for yt-dlp errors
- Verify yt-dlp is installed via nixpacks.toml
- Some platforms may block video downloads (YouTube may block datacenter IPs)

## Cost Estimate

Railway pricing:
- **Free trial**: $5 credit (lasts 1-2 weeks with light usage)
- **After trial**: ~$5-10/month depending on usage
- **Hobby plan**: $5/month for personal projects
- **Pro plan**: Pay-as-you-go ($10-20/month for moderate traffic)

## Next Steps: SEO & Getting on Google

Once deployed:
1. Submit your site to [Google Search Console](https://search.google.com/search-console)
2. Create a sitemap.xml (I can help with this)
3. Add proper meta tags for SEO
4. Share your site URL!

## Need Help?

Check Railway logs: Dashboard → Your Service → "Deployments" → Latest deployment → Logs

Common commands:
```bash
railway logs          # View logs
railway status        # Check deployment status
railway variables     # View environment variables
```
