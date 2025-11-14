# Deploy Mixillo Backend to AWS App Runner

This guide deploys the Node.js Express API (backend/) to AWS App Runner using a container image in ECR.

## Prerequisites
- AWS account with permissions: ECR (pull/push), App Runner, IAM
- AWS CLI v2 installed and configured (`aws configure`)
- Docker installed and logged in to AWS ECR
- MongoDB Atlas (or other MongoDB) connection string

## 1) Build and push image to ECR

Replace placeholders for REGION and ACCOUNT_ID.

```bash
# From repo root
aws ecr create-repository --repository-name mixillo-backend || true

# Get account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)

# Build and tag
docker build -t mixillo-backend:latest -f backend/Dockerfile backend

docker tag mixillo-backend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mixillo-backend:latest

# Login and push
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mixillo-backend:latest
```

## 2) Create App Runner service

In AWS Console → App Runner → Create service → From container registry → ECR → select image.

- Runtime: Use image from ECR
- Port: 5000
- Health check: Path `/health`, Protocol HTTP, Interval 5–10s, Timeout 5s, Healthy threshold 1–2
- Auto deploy: Enabled (on new image)
- CPU/memory: 1 vCPU / 2GB is a good start
- Networking: Public
- Environment variables (minimum):
  - NODE_ENV = production
  - PORT = 5000
  - MONGODB_URI = <your MongoDB connection string>
  - JWT_SECRET = <random-long-secret>
  - JWT_REFRESH_SECRET = <random-long-secret>
  - JWT_EXPIRE = 7d (optional)
  - JWT_REFRESH_EXPIRE = 30d (optional)
  - ENABLE_CRON = false (recommended initially)
  - FRONTEND_URL = https://your-amplify-or-cloudfront-domain (optional; not required due to regex CORS)
  - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET (optional; required for S3 uploads)

Notes:
- File uploads should use S3; the container filesystem is ephemeral. Configure the S3 env vars when enabling upload features.
- Redis is optional; background workers are not started unless you run worker scripts. If you enable transcode queues, set REDIS_HOST/REDIS_PORT/REDIS_PASSWORD and run workers separately.

## 3) Point the admin dashboard to the new API

- If using Amplify Hosting: set `REACT_APP_API_URL` = `https://<your-apprunner-domain>` in Amplify Environment variables and redeploy.
- If using S3+CloudFront: set the same value in your CI/CD (or `admin-dashboard/.env.production`).

## 4) Smoke test

- Health: `GET https://<your-apprunner-domain>/health`
- Login (from browser): visit your Amplify/CloudFront admin domain and log in. The API now runs on App Runner.

## 5) Updates

- Rebuild and push to ECR, then App Runner will auto-deploy if "Auto deploy" is ON:
```bash
docker build -t mixillo-backend:latest -f backend/Dockerfile backend && \
docker tag mixillo-backend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mixillo-backend:latest && \
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mixillo-backend:latest
```

---

## Alternative: Elastic Beanstalk (no Docker)

- Create an EB application (Node.js 18 platform)
- Source bundle: zip the `backend/` folder contents
- Environment variables: same as above
- Health check URL: `/health`
- Scaling: t3.small or better

EB uses `npm start` and our `backend/package.json` points to `src/server-simple.js`.
