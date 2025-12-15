# FastPast - Koyeb.com Deployment Guide

## Step 1: Build Settings (Current Screen)

You are on the "Build options" screen.
**You do NOT need to change anything here.**

1.  **Buildpack**: Keep it selected.
2.  **Override buttons**: Leave them **OFF** (Gray/Unchecked).
    *   Koyeb automatically reads your `package.json` file.
    *   It will automatically run `npm install` and `npm start`.
3.  **Click "Next"** at the bottom.

---

## Step 2: Environment Variables (Next Screen)

On the **"Service settings"** or **"Environment"** screen:

1.  Find the **"Environment variables"** section.
2.  Click **"Add variable"** to add these keys and values:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | *Paste your full MongoDB connection string here* |
| `YOUTUBE_API_KEY_1` | *Your YouTube API Key (if you have one)* |

---

## Step 3: Instance Size

1.  Select **"Free"** (or "Nano") if available.
2.  **Regions**: Choose the one closest to you (e.g., Frankfurt/Washington).

---

## Step 4: Name & Deploy

1.  **App Name**: `fastpast` (or similar).
2.  Click **"Deploy"**.

---

## 🔍 After Deployment

Koyeb will build your app (takes 2–3 minutes).
Once it's green/healthy:
1.  Click the **Public URL** (ends in `.koyeb.app`).
2.  Your site is LIVE!

### 🚨 Google Search Console
Don't forget to submit your new `.koyeb.app` URL to Google Search Console to get indexed!
