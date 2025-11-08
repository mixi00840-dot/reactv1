# MongoDB Setup Instructions

## 1. Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier
3. Create a new cluster (M0 Sandbox - FREE)
4. Wait for cluster to be created (3-5 minutes)

## 2. Configure Database Access

1. In Atlas, go to **Database Access**
2. Click **Add New Database User**
3. Create username and password
4. Grant **Read and Write** to any database
5. Save the credentials securely

## 3. Configure Network Access

1. In Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
4. Or add specific IPs for production

## 4. Get Connection String

1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `mixillo`

Example:
```
mongodb+srv://mixillo_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mixillo?retryWrites=true&w=majority
```

## 5. Add to Environment Variables

Add these to your `.env` file:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/mixillo?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Migration Mode (dual = both Firebase and MongoDB active)
DATABASE_MODE=dual
```

## 6. Generate Secure JWT Secrets

Run this in Node.js console:
```javascript
require('crypto').randomBytes(64).toString('hex')
```

Use the output for JWT_SECRET and JWT_REFRESH_SECRET

## 7. Test Connection

Run:
```bash
cd backend
node -e "require('./src/utils/mongodb').then(() => console.log('Connected!')).catch(console.error)"
```


