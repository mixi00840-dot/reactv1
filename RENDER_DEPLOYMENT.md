# 🚀 Render Deployment Configuration

## Environment Variables for Render Dashboard

Copy and paste these **exact values** into your Render service Environment tab:

### Production Environment Variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://mixi00840_db_user:zYrShCvqYAJCUwRm@mixillo.3gfymei.mongodb.net/?appName=mixillo
JWT_SECRET=02dbb55ab33654e02bc2a7dde60eb1bae0d4684fe19a5e5f5558e25f9a927738fc95ca02ed6efc47161836e978b8220b02028ff6ff45710540787f9673d1648b
FRONTEND_URL=https://your-frontend-domain.com
ENABLE_CRON=true
```

## Render Service Configuration:

### Web Service Settings:
- **Environment**: Node
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && node src/server-simple.js`
- **Auto-Deploy**: Yes

### Region: 
Choose the region closest to your users (US East recommended for global reach)

## Steps to Deploy:

1. **Create Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repository: `mixi00840-dot/reactv1`

2. **Configure Build Settings**
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node src/server-simple.js`

3. **Add Environment Variables**
   - Go to Environment tab
   - Add each variable from the list above
   - Click "Save Changes"

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)

## Test Your Deployment:

Once deployed, test these URLs (replace `your-app-name` with your actual Render URL):

- Health Check: `https://your-app-name.onrender.com/health`
- Database Check: `https://your-app-name.onrender.com/api/health/db`
- API Status: `https://your-app-name.onrender.com/api/auth/health`

## Troubleshooting:

If deployment fails, check:
1. Environment variables are set correctly
2. MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
3. View deployment logs in Render dashboard

## Security Notes:

✅ MongoDB URI includes password - Keep secure!
✅ JWT Secret is cryptographically strong (128 characters)
✅ Environment variables are properly configured