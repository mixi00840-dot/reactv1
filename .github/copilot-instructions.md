# Mixillo - TikTok-Style Social Commerce Platform

Complete backend API system for Mixillo, a video-first social commerce platform combining TikTok-style content with integrated e-commerce, live streaming, and digital wallet features.

## Project Architecture

### Backend Stack
- **Runtime**: Node.js 18
- **Framework**: Express 4.21.1
- **Database**: MongoDB Atlas + Mongoose 8.8.4 (64 models)
- **Real-time**: Socket.IO 4.8.1 (live streams, notifications, chat)
- **Cache**: Redis 4.7.0 (sessions, rate limiting)
- **Auth**: JWT (jsonwebtoken 9.0.2) + bcryptjs 2.4.3
- **Media**: Cloudinary 2.5.1 CDN + Multer 1.4.5 uploads
- **AI**: Google Cloud Speech API 6.8.0 (auto-captions)
- **Streaming**: Agora SDK 2.0.4 (live video infrastructure)
- **Deployment**: Google Cloud Run (europe-west1, serverless containers)

### Project Structure
```
backend/
  src/
    app.js                 # Express app setup
    server.js              # Server entry point
    config/                # DB, Redis, Cloudinary config
    models/                # 64 Mongoose schemas
    routes/                # API route definitions
    controllers/           # Business logic
    middleware/            # Auth, validation, error handling
    services/              # External integrations (Socket.IO, Redis)
    utils/                 # Helpers, validators
  uploads/                 # Local file storage (avatars, videos, documents)
  tests/                   # Integration & unit tests

admin-dashboard/          # React admin panel
docs/                     # API documentation
```

### Database Models (64 Total)

**Core User Models:**
- `User` - Authentication, profile, roles (user/seller/admin)
- `Profile` - Extended user info, bio, avatar
- `Follower`, `Following` - Social graph
- `BlockedUser` - User blocking system

**Content Models:**
- `Content` - Video posts (TikTok-style)
- `Post` - General social posts
- `Story` - 24-hour ephemeral content
- `Comment`, `Like`, `Share`, `View` - Engagement tracking

**E-commerce Models:**
- `Product`, `ProductVariant` - Product catalog
- `Cart`, `CartItem` - Shopping cart
- `Order`, `Payment` - Order processing
- `Wishlist` - Saved products

**Wallet & Coins:**
- `Wallet` - User digital wallet
- `Transaction` - Wallet transactions
- `Coin` - Virtual currency
- `Gift`, `GiftTransaction` - Virtual gifting

**Live Streaming:**
- `LiveStream` - Live broadcast sessions
- `LiveParticipant` - Stream viewers
- `LiveGift` - In-stream virtual gifts

**Social Features:**
- `ChatRoom`, `Message` - Direct messaging
- `Notification` - Push notifications
- `Report` - Content reporting/moderation

**Admin:**
- `AdminUser`, `AdminAction` - Admin audit trail
- `SystemSetting` - App configuration
- `Analytics` - Usage metrics

## Critical Routing Patterns

### Express Route Ordering Rules
**ALWAYS place specific routes BEFORE generic parameterized routes.**

❌ **WRONG - Causes bugs:**
```javascript
router.get('/:id', getById);        // Line 130 - catches everything
router.get('/featured', getFeatured); // Line 303 - NEVER reached
```

✅ **CORRECT:**
```javascript
router.get('/featured', getFeatured); // Line 130 - specific first
router.get('/:id', getById);         // Line 191 - generic last
```

**Why:** Express matches routes in definition order. Generic `/:id` catches all paths including `/featured`, causing MongoDB ObjectId validation errors when "featured" is parsed as an ID.

### API Route Structure

**Authentication Routes** (`/api/auth`):
- `POST /register` - User registration
- `POST /login` - User login (returns JWT access + refresh tokens)
- `POST /refresh` - Refresh access token
- `POST /logout` - Invalidate tokens

**User Routes** (`/api/users`):
- `GET /me` - Current user profile (auth required)
- `PUT /me` - Update profile (auth required)
- `GET /:id` - Get user by ID
- `POST /:id/follow` - Follow user (auth required)
- `DELETE /:id/unfollow` - Unfollow user (auth required)

**Content Routes** (`/api/content`):
- `GET /feed` - Video feed (paginated)
- `POST /` - Upload video (auth + multer)
- `GET /:id` - Get video details
- `POST /:id/view` - Record view
- `POST /:id/like` - Like video (auth required)
- `POST /:id/comment` - Comment on video (auth required)

**Product Routes** (`/api/products`):
- `GET /featured` - Featured products (BEFORE /:id)
- `GET /search` - Search products (BEFORE /:id)
- `GET /:id` - Get product by ID (AFTER specific routes)
- `POST /` - Create product (seller auth)
- `PUT /:id` - Update product (seller auth)
- `DELETE /:id` - Delete product (seller auth)

**Cart Routes** (`/api/cart`):
- `GET /` - Get user cart (auth required)
- `POST /items` - Add item to cart (auth required)
- `PUT /items/:itemId` - Update quantity (auth required)
- `DELETE /items/:itemId` - Remove item (auth required)
- `POST /checkout` - Checkout cart (auth required)

**Wallet Routes** (`/api/wallet`):
- `GET /balance` - Get wallet balance (auth required)
- `GET /transactions` - Transaction history (auth required)
- `POST /topup` - Add funds (auth required)
- `POST /transfer` - Transfer to another user (auth required)

**Live Streaming Routes** (`/api/live`):
- `POST /start` - Start live stream (auth required, returns Agora token)
- `POST /:streamId/join` - Join stream as viewer (auth required, returns token)
- `POST /:streamId/gift` - Send gift during stream (auth required)
- `POST /:streamId/end` - End stream (broadcaster auth)

**Admin Routes** (`/api/admin`):
- `GET /users` - List all users (admin auth)
- `PUT /users/:id/ban` - Ban user (admin auth)
- `PUT /users/:id/verify` - Verify seller (admin auth)
- `GET /analytics` - System analytics (admin auth)

## Authentication & Middleware Patterns

### JWT Token Flow
```javascript
// User model methods (models/User.js)
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Password hashing (pre-save hook)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

### Middleware Chain Pattern
```javascript
// Authentication middleware (middleware/auth.js)
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin-only middleware
const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// Seller-only middleware
const sellerAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Seller access required' });
    }
    next();
  });
};
```

### File Upload Pattern (Multer + Cloudinary)
```javascript
// Configure multer for local temp storage
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

// Upload to Cloudinary after local save
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'mixillo/videos',
      public_id: `${req.user._id}_${Date.now()}`
    });
    
    // Clean up local temp file
    fs.unlinkSync(req.file.path);
    
    // Save to database
    const content = new Content({
      videoUrl: result.secure_url,
      creator: req.user._id,
      // ... other fields
    });
    await content.save();
    
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Real-Time Features (Socket.IO)

### Socket Service Pattern
```javascript
// services/socketService.js
class SocketService {
  constructor(io) {
    this.io = io;
  }
  
  // Emit video view to all connected clients
  emitVideoView(contentId, viewCount) {
    this.io.emit('video:view', { contentId, viewCount });
  }
  
  // Emit like to specific room
  emitLike(contentId, userId, likeCount) {
    this.io.to(`content:${contentId}`).emit('content:like', { userId, likeCount });
  }
  
  // Emit live stream update
  emitLiveUpdate(streamId, data) {
    this.io.to(`live:${streamId}`).emit('live:update', data);
  }
  
  // Emit notification to specific user
  emitNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }
}

// Initialize in server.js
const socketService = new SocketService(io);

// Use in controllers
await socketService.emitVideoView(contentId, video.views);
```

### Socket Connection Management
```javascript
// server.js
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user:${decoded.id}`);
      socket.emit('authenticated');
    } catch (error) {
      socket.emit('auth_error', { message: 'Invalid token' });
    }
  });
  
  // Join content room
  socket.on('join:content', (contentId) => {
    socket.join(`content:${contentId}`);
  });
  
  // Join live stream room
  socket.on('join:live', (streamId) => {
    socket.join(`live:${streamId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

## Database Patterns

### Schema Design Best Practices
```javascript
// Always include timestamps
const schema = new mongoose.Schema({
  // fields...
}, { timestamps: true }); // Adds createdAt, updatedAt

// Add indexes for frequently queried fields
schema.index({ email: 1 }, { unique: true });
schema.index({ username: 1 }, { unique: true });
schema.index({ createdAt: -1 }); // For sorting by date

// Use refs for relationships
creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

// Virtual populate for reverse relationships
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'creator'
});
```

### Pagination Pattern
```javascript
// controllers/contentController.js
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const contents = await Content.find()
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Content.countDocuments();
    
    res.json({
      contents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Transaction Pattern (for critical operations)
```javascript
// Use MongoDB transactions for multi-document operations
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Deduct from sender wallet
  await Wallet.updateOne(
    { user: senderId },
    { $inc: { balance: -amount } },
    { session }
  );
  
  // Add to receiver wallet
  await Wallet.updateOne(
    { user: receiverId },
    { $inc: { balance: amount } },
    { session }
  );
  
  // Create transaction record
  await Transaction.create([{
    from: senderId,
    to: receiverId,
    amount,
    type: 'transfer'
  }], { session });
  
  await session.commitTransaction();
  res.json({ success: true });
} catch (error) {
  await session.abortTransaction();
  res.status(500).json({ error: error.message });
} finally {
  session.endSession();
}
```

## Deployment & Environment

### Google Cloud Run Configuration
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/mixillo-backend', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/mixillo-backend']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'mixillo-backend'
      - '--image=gcr.io/$PROJECT_ID/mixillo-backend'
      - '--platform=managed'
      - '--region=europe-west1'
      - '--allow-unauthenticated'
      - '--port=5000'
```

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@mixillo.tt9e6by.mongodb.net/mixillo

# Authentication
JWT_SECRET=<random-256-bit-secret>
REFRESH_TOKEN_SECRET=<random-256-bit-secret>

# Redis
REDIS_URL=redis://default:pass@redis-host:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Agora (Live Streaming)
AGORA_APP_ID=your-app-id
AGORA_APP_CERTIFICATE=your-certificate

# Server
PORT=5000
NODE_ENV=production
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "seed": "node seed-database.js",
    "migrate": "node src/scripts/migrate.js"
  }
}
```

## Testing Patterns

### API Testing Structure
```javascript
// tests/integration/auth.test.js
describe('Auth API', () => {
  let server;
  let user;
  
  beforeAll(async () => {
    server = await require('../../src/server');
    await mongoose.connection.dropDatabase();
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
    });
  });
});
```

### Mock Data Creation
```javascript
// Always use valid MongoDB ObjectIds for testing
const mongoose = require('mongoose');

// Generate valid ObjectId
const validId = new mongoose.Types.ObjectId();

// Create test data
const testContent = {
  _id: validId,
  videoUrl: 'https://example.com/video.mp4',
  creator: new mongoose.Types.ObjectId(),
  caption: 'Test video'
};

// ❌ NEVER use string IDs like "mock-1", "test-123"
// ✅ ALWAYS use mongoose.Types.ObjectId()
```

## Security Best Practices

1. **Always hash passwords** - Use bcryptjs with salt rounds ≥ 10
2. **Validate JWT tokens** - Check signature, expiration, and user existence
3. **Sanitize inputs** - Use express-validator for request validation
4. **Rate limiting** - Use express-rate-limit on auth endpoints
5. **CORS configuration** - Whitelist specific origins in production
6. **File upload validation** - Check file types, sizes, and scan for malware
7. **SQL injection prevention** - Mongoose escapes queries automatically
8. **XSS prevention** - Sanitize user-generated content before storage
9. **HTTPS only** - Enforce secure connections in production
10. **Environment secrets** - Never commit .env files to Git

## Error Handling Patterns

### Global Error Handler
```javascript
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Default 500 error
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
};

// Use in app.js
app.use(errorHandler);
```

### Try-Catch Wrapper
```javascript
// utils/asyncHandler.js
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Use in routes
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const data = await Model.find();
  res.json(data);
}));
```

## System Stability Requirements

When working on this codebase, prioritize:

1. **Deployment Stability** - Verify Google Cloud Run settings, environment variables, IAM permissions, and health checks before deploying
2. **API Integrity** - Test all endpoints after changes; ensure 200 OK responses with correct data schemas
3. **Database Consistency** - Validate schemas match models; verify indexes are optimized; clean duplicate/test data
4. **Production Health** - Monitor GCloud logs for errors; fix crashes, memory leaks, auth failures immediately
5. **Security Hardening** - Ensure JWT logic correct; protect private endpoints; enable rate limits; configure CORS properly
6. **Long-term Stability** - Remove duplicate configs; create single-source-of-truth for environment; enable monitoring alerts

### Pre-Deployment Checklist
- [ ] All models have proper indexes
- [ ] All routes follow ordering rules (specific before generic)
- [ ] All endpoints tested and return correct status codes
- [ ] Environment variables configured (no missing keys)
- [ ] Database connection stable
- [ ] Redis connection stable
- [ ] Cloudinary credentials valid
- [ ] JWT secrets set and secure
- [ ] CORS origins whitelisted
- [ ] Rate limits enabled
- [ ] File upload limits configured
- [ ] Error handling middleware active
- [ ] Logging configured for production
- [ ] Health check endpoints responding
- [ ] No hardcoded secrets in code

### Common Issues & Fixes

**Issue: Route returns 500 with "invalid ObjectId"**
- **Cause**: Generic `/:id` route catching specific routes like `/featured`
- **Fix**: Move specific routes BEFORE `/:id` route in file

**Issue: JWT token expired errors**
- **Cause**: Access token expiry (1 hour)
- **Fix**: Use refresh token to get new access token

**Issue: File upload fails with 413 Payload Too Large**
- **Cause**: Express body-parser limit too low
- **Fix**: Increase limit in app.js: `app.use(express.json({ limit: '100mb' }))`

**Issue: CORS errors from Flutter app**
- **Cause**: Origin not whitelisted
- **Fix**: Add Flutter app origin to CORS middleware

**Issue: MongoDB connection timeout**
- **Cause**: Wrong connection string or network issue
- **Fix**: Verify MONGODB_URI, check Atlas IP whitelist (allow all: 0.0.0.0/0 for Cloud Run)

**Issue: Cloudinary upload fails**
- **Cause**: Invalid credentials or quota exceeded
- **Fix**: Verify CLOUDINARY_* env variables, check usage on dashboard

## Development Workflow

1. **Local Development**
   ```bash
   cd backend
   npm install
   npm run dev  # Starts with nodemon on port 5000
   ```

2. **Database Seeding**
   ```bash
   npm run seed  # Populates database with test data
   ```

3. **Testing**
   ```bash
   npm test              # Run all tests
   npm run test:watch    # Watch mode
   ```

4. **Deployment**
   ```bash
   # From backend directory
   gcloud run deploy mixillo-backend \
     --source . \
     --region=europe-west1 \
     --allow-unauthenticated \
     --project=mixillo \
     --port=5000
   ```

5. **Monitoring**
   ```bash
   # View logs
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mixillo-backend" --limit=50
   
   # Check service status
   gcloud run services describe mixillo-backend --region=europe-west1
   ```

## AI Agent Guidelines

When modifying this codebase:

- **Always read existing code** before making changes to understand patterns
- **Test all changes locally** before deploying to production
- **Use Mongoose methods** instead of raw MongoDB queries
- **Follow existing patterns** for consistency (authentication, error handling, pagination)
- **Add indexes** for any new query patterns
- **Update this document** when introducing new patterns or architecture changes
- **Prioritize stability** over new features - fix bugs first
- **Write tests** for new endpoints and critical logic
- **Document breaking changes** in commit messages
- **Never commit secrets** to Git - use environment variables
- **Verify deployments** by testing health endpoints after deploy

Focus on clean code, security, scalability, and modern API patterns.