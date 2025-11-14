# Google Cloud Run Deployment Guide

Complete guide to deploy Mixillo Backend to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Create at https://console.cloud.google.com
2. **Google Cloud CLI**: Install from https://cloud.google.com/sdk/docs/install
3. **Enable Billing**: Cloud Run requires a billing account

## Step-by-Step Deployment

### 1. Install Google Cloud CLI

**Windows PowerShell:**
```powershell
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**Or download manually:** https://cloud.google.com/sdk/docs/install

### 2. Initialize Google Cloud

```powershell
# Login to your Google account
gcloud auth login

# Create a new project or use existing
gcloud projects create mixillo-backend --name="Mixillo Backend"

# Set the project as active
gcloud config set project mixillo-backend

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Prepare Environment Variables

Create a `.env.yaml` file in the `backend/` directory (DO NOT commit this):

```yaml
NODE_ENV: production
PORT: "5000"
ENABLE_CRON: "false"
REDIS_ENABLED: "false"

# MongoDB Connection
MONGODB_URI: mongodb+srv://mixi00840_db_user:UhDD5IgyRsozsKfK@mixillo.t8e6by.mongodb.net/mixillo?retryWrites=true&w=majority

# JWT Secrets (CHANGE THESE!)
JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET: your-super-secret-refresh-token-key-minimum-32-characters
JWT_EXPIRE: 7d
JWT_REFRESH_EXPIRE: 30d

# Frontend URL
FRONTEND_URL: https://main.d2rfj1fx7t69dy.amplifyapp.com

# Admin Defaults
DEFAULT_ADMIN_EMAIL: admin@mixillo.com
DEFAULT_ADMIN_PASSWORD: Admin123!
DEFAULT_ADMIN_USERNAME: admin
```

### 4. Deploy to Cloud Run

```powershell
# Navigate to backend directory
cd backend

# Deploy with automatic container build
gcloud run deploy mixillo-backend `
  --source . `
  --platform managed `
  --region europe-west1 `
  --allow-unauthenticated `
  --port 5000 `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10 `
  --timeout 300 `
  --env-vars-file .env.yaml
```

**Explanation:**
- `--source .` - Builds from current directory (Dockerfile)
- `--region europe-west1` - Choose closest region (options: us-central1, europe-west1, asia-east1)
- `--allow-unauthenticated` - Makes API publicly accessible
- `--memory 1Gi` - 1GB RAM per instance
- `--cpu 1` - 1 vCPU per instance
- `--min-instances 0` - Scale to zero when idle (saves costs)
- `--max-instances 10` - Maximum concurrent instances
- `--timeout 300` - 5 minute request timeout

### 5. Get Your Backend URL

After deployment completes, you'll see output like:
```
Service [mixillo-backend] revision [mixillo-backend-00001-xyz] has been deployed and is serving 100 percent of traffic.
Service URL: https://mixillo-backend-xxxxxxxxx-ew.a.run.app
```

### 6. Test Your Deployment

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "https://YOUR-CLOUD-RUN-URL/health" -UseBasicParsing

# Test database health
Invoke-WebRequest -Uri "https://YOUR-CLOUD-RUN-URL/api/health/db" -UseBasicParsing
```

### 7. Update Admin Dashboard

Update `admin-dashboard/.env.production`:
```env
REACT_APP_API_URL=https://mixillo-backend-xxxxxxxxx-ew.a.run.app
```

Then redeploy to Amplify:
```powershell
cd admin-dashboard
git add .env.production
git commit -m "update: point to Google Cloud Run backend"
git push
```

## Cost Optimization

**Cloud Run Pricing (Free Tier):**
- 2 million requests/month
- 360,000 vCPU-seconds/month
- 180,000 GiB-seconds/month
- Scales to zero when idle = $0 when not in use

**Tips:**
- Use `--min-instances 0` to scale to zero
- Set `--max-instances` to prevent runaway costs
- Use `--memory 512Mi` for lighter workloads

## Monitoring & Logs

**View Logs:**
```powershell
# Stream real-time logs
gcloud run services logs tail mixillo-backend --region europe-west1

# View recent logs in browser
gcloud run services logs read mixillo-backend --region europe-west1 --limit 100
```

**Cloud Console:**
https://console.cloud.google.com/run

## Updating the Service

```powershell
# After code changes, just redeploy
cd backend
gcloud run deploy mixillo-backend `
  --source . `
  --region europe-west1
```

Cloud Run will automatically:
1. Build new container from Dockerfile
2. Deploy with zero downtime
3. Route traffic to new version

## Custom Domain (Optional)

```powershell
# Map custom domain
gcloud run domain-mappings create `
  --service mixillo-backend `
  --domain api.mixillo.com `
  --region europe-west1
```

Then add DNS records as instructed by Cloud Run.

## Troubleshooting

**Container fails to start:**
```powershell
# Check build logs
gcloud builds list --limit 5

# View specific build
gcloud builds log <BUILD_ID>
```

**MongoDB connection issues:**
1. Verify MongoDB Atlas **Network Access** allows `0.0.0.0/0`
2. Check connection string in `.env.yaml`
3. Try standard connection format instead of SRV

**High costs:**
- Check `--max-instances` setting
- Ensure `--min-instances 0` for scale-to-zero
- Monitor requests in Cloud Console

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/deploy-cloud-run.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy mixillo-backend \
            --source ./backend \
            --region europe-west1 \
            --platform managed
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Must be `5000` (matches Dockerfile) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (min 32 chars) |
| `FRONTEND_URL` | Yes | Admin dashboard URL |
| `ENABLE_CRON` | No | Set to `false` unless you need background jobs |
| `REDIS_ENABLED` | No | Set to `false` (Redis not included) |

## Support

- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Pricing Calculator**: https://cloud.google.com/products/calculator
- **Status Dashboard**: https://status.cloud.google.com

---

**Deployment Time:** ~3-5 minutes  
**Cold Start Time:** ~1-2 seconds  
**Auto-scaling:** Yes (0 to max-instances)
