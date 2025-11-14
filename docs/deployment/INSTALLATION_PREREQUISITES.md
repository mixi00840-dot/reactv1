# Installing Prerequisites for Mixillo Backend

This guide will help you install **FFmpeg** (for video processing) and **Redis** (for job queue) on Windows.

---

## 🎬 Install FFmpeg (Video Transcoding)

FFmpeg is required for Phase 2 (Video Processing & Transcoding).

### Option 1: Chocolatey (Recommended)

If you have Chocolatey installed:

```powershell
choco install ffmpeg
```

### Option 2: Manual Installation

1. **Download FFmpeg**
   - Visit: https://www.gyan.dev/ffmpeg/builds/
   - Download: `ffmpeg-release-essentials.zip`

2. **Extract**
   - Extract to: `C:\ffmpeg`

3. **Add to PATH**
   ```powershell
   # Run PowerShell as Administrator
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ffmpeg\bin", "Machine")
   ```

4. **Verify Installation**
   ```powershell
   # Close and reopen PowerShell
   ffmpeg -version
   ```

   You should see FFmpeg version info.

---

## 🔴 Install Redis (Job Queue Backend)

Redis is required for Phase 2 (Video Transcoding Queue) and Phase 3 (Metrics Processing).

### Option 1: Docker (Recommended)

If you have Docker Desktop installed:

```powershell
docker run -d --name redis -p 6379:6379 redis:latest
```

**Verify:**
```powershell
docker ps
```

You should see Redis container running.

**Start/Stop:**
```powershell
docker start redis
docker stop redis
```

### Option 2: WSL2 + Ubuntu

If you have Windows Subsystem for Linux (WSL2):

```bash
# In WSL2 Ubuntu terminal
sudo apt update
sudo apt install redis-server -y

# Start Redis
sudo service redis-server start

# Verify
redis-cli ping
# Should return: PONG
```

### Option 3: Native Windows (Memurai)

Memurai is a Redis-compatible server for Windows:

1. **Download Memurai**
   - Visit: https://www.memurai.com/get-memurai
   - Download: Memurai Developer Edition (free)

2. **Install**
   - Run installer
   - Follow installation wizard

3. **Verify**
   ```powershell
   redis-cli ping
   ```

---

## ✅ Verify All Prerequisites

Run these commands to ensure everything is installed:

```powershell
# Check Node.js
node --version
# Should show: v18.x.x or higher

# Check npm
npm --version
# Should show: 9.x.x or higher

# Check FFmpeg
ffmpeg -version
# Should show FFmpeg version info

# Check Redis (Docker)
docker ps | findstr redis
# Should show Redis container

# OR Check Redis (WSL/Memurai)
redis-cli ping
# Should return: PONG
```

---

## 📦 Install Node Dependencies

After installing FFmpeg and Redis, install the Node.js dependencies:

```powershell
cd backend
npm install
```

This will install:
- `fluent-ffmpeg` - FFmpeg wrapper for Node.js
- `bullmq` - Distributed job queue
- `ioredis` - Redis client

---

## 🚀 Start the Backend

### 1. Start MongoDB

Make sure MongoDB is running (from Phase 1).

### 2. Start Redis (if not already running)

```powershell
# Docker
docker start redis

# OR WSL2
wsl sudo service redis-server start

# OR Memurai (usually auto-starts)
# Check Windows Services
```

### 3. Start Backend Dev Server

```powershell
cd backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
✅ Server running on port 5000
```

### 4. Start Video Transcoding Worker (Phase 2)

In a **new terminal**:

```powershell
cd backend
npm run worker:transcode
```

You should see:
```
🚀 Starting Video Transcode Worker...
✅ Connected to MongoDB
✅ Connected to Redis
✅ Worker started with concurrency: 2
```

### 5. Start Metrics Aggregation Worker (Phase 3)

In a **new terminal**:

```powershell
cd backend
npm run worker:metrics
```

You should see:
```
🚀 Starting Event Aggregation Worker...
✅ Connected to MongoDB
🔄 Starting event aggregation loop...
```

---

## 🧪 Test the Setup

### Test FFmpeg

```powershell
ffmpeg -version
```

### Test Redis Connection

```powershell
redis-cli ping
# Should return: PONG
```

### Test Backend API

```powershell
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "API is running"
}
```

---

## 🐛 Troubleshooting

### FFmpeg not found

**Error:** `ffmpeg: command not found` or `'ffmpeg' is not recognized`

**Solution:**
- Verify FFmpeg is in PATH: `echo $env:Path`
- Close and reopen PowerShell/terminal
- Try manual PATH addition (see above)

### Redis connection failed

**Error:** `Redis connection failed` or `ECONNREFUSED`

**Solution:**
- Docker: `docker start redis`
- WSL2: `wsl sudo service redis-server start`
- Check Redis is listening: `netstat -an | findstr 6379`

### Port already in use

**Error:** `Port 5000 is already in use`

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

---

## 📚 Environment Variables

Create `.env` file in `backend/` directory:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/mixillo

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=30d

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# FFmpeg (optional, uses system FFmpeg by default)
FFMPEG_PATH=

# Metrics
METRICS_AGGREGATION_INTERVAL=60000

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=524288000
```

---

## 🎯 Next Steps

Once all prerequisites are installed and verified:

1. ✅ Backend running on http://localhost:5000
2. ✅ MongoDB connected
3. ✅ Redis connected
4. ✅ FFmpeg available
5. ✅ Transcode worker running
6. ✅ Metrics worker running

**You're ready to test Phases 1-3!**

Try uploading a video through the API and watch it get transcoded and tracked automatically.

---

## 📖 Additional Resources

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Redis Documentation**: https://redis.io/docs/
- **BullMQ Documentation**: https://docs.bullmq.io/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
