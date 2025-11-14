# Mixillo User Management System

A complete TikTok-style app backend and admin dashboard for managing users and sellers with comprehensive control features.

## 🚀 Quick Deploy to Render

### Backend API
1. Create a new **Web Service** on [Render](https://render.com)
2. Connect this GitHub repository
3. Use these settings:
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Auto-Deploy**: Yes

### Environment Variables Required
Add these in Render Dashboard → Environment:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-super-secret-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Admin Dashboard Deploy
1. Create another **Static Site** on Render
2. Build Command: `cd admin-dashboard && npm install && npm run build`
3. Publish Directory: `admin-dashboard/build`

## 🚀 Features

### Backend API
- **JWT Authentication** for users and admins
- **User Management** with role-based access control
- **Seller Application System** with document verification
- **File Upload** support for avatars and documents
- **Admin Controls**: ban, suspend, verify, feature users
- **Wallet Management** with earnings tracking
- **Strike System** for user moderation
- **MongoDB** with Mongoose ODM
- **Express.js** with comprehensive middleware

### Admin Dashboard
- **Modern React UI** with Material-UI components
- **Real-time Analytics** with Chart.js
- **User Management** with advanced filtering
- **Seller Application Review** with document preview
- **Strike Management** for user moderation
- **Responsive Design** for all devices

## 📁 Project Structure

```
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, upload, validation
│   │   ├── utils/           # Database, helpers
│   │   └── app.js           # Main application
│   ├── uploads/             # File storage
│   ├── package.json
│   └── .env.example
│
├── admin-dashboard/         # React Admin Panel
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Route components
│   │   ├── contexts/        # React contexts
│   │   └── App.js
│   └── package.json
│
├── docs/                    # Documentation
└── .github/                 # GitHub configuration
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mixillo-user-management
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
npm run dev
```

### 3. Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm start
```

### 4. Environment Variables
Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/mixillo
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload avatar
- `GET /api/users/stats` - Get user statistics

### Sellers
- `POST /api/sellers/apply` - Submit seller application
- `GET /api/sellers/application` - Get application status
- `PUT /api/sellers/application` - Update application
- `GET /api/sellers/status` - Get verification status

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `PUT /api/admin/users/:id/verify` - Toggle verification
- `GET /api/admin/seller-applications` - Get applications
- `POST /api/admin/strikes` - Issue strikes/warnings

## 📊 Database Schema

### Users Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  fullName: String,
  avatar: String,
  role: ['user', 'admin'],
  status: ['active', 'suspended', 'banned'],
  isVerified: Boolean,
  isFeatured: Boolean,
  // Social stats
  followersCount: Number,
  videosCount: Number,
  // Timestamps
  createdAt: Date,
  lastLogin: Date
}
```

### Seller Applications
```javascript
{
  userId: ObjectId,
  status: ['pending', 'approved', 'rejected'],
  documentType: ['passport', 'national_id', 'driving_license'],
  documentNumber: String,
  documentImages: [{ url: String, uploadedAt: Date }],
  businessName: String,
  reviewedBy: ObjectId,
  reviewedAt: Date
}
```

### Wallets
```javascript
{
  userId: ObjectId,
  balance: Number,
  totalEarnings: Number,
  totalSpendings: Number,
  supportLevel: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
  monthlyEarnings: Number
}
```

### Strikes
```javascript
{
  userId: ObjectId,
  type: ['warning', 'strike', 'final_warning'],
  severity: ['low', 'medium', 'high', 'critical'],
  reason: String,
  actionTaken: String,
  issuedBy: ObjectId,
  status: ['active', 'appealed', 'overturned'],
  expiresAt: Date
}
```

## 🔐 Admin Features

### User Management
- View all users with advanced filtering
- Ban/suspend/activate user accounts
- Verify users (blue checkmark)
- Feature users for explore page
- View user statistics and wallet info
- Issue strikes and warnings

### Seller Management
- Review seller applications
- View uploaded documents
- Approve/reject applications with notes
- Track application history

### Analytics
- Dashboard with key metrics
- User registration trends
- Top earners leaderboard
- Status distribution charts
- Monthly analytics

## 📱 Flutter Integration

The API is designed to work seamlessly with Flutter applications:

### Key Endpoints for Mobile
```dart
// Authentication
POST /api/auth/register
POST /api/auth/login

// User Profile
GET /api/users/profile
PUT /api/users/profile
POST /api/users/upload-avatar

// Seller Features
POST /api/sellers/apply
GET /api/sellers/status

// Real-time Status Checks
GET /api/users/notifications
```

### Example Flutter Usage
```dart
// Check if user is verified
final response = await http.get('/api/users/profile');
final isVerified = response.data['user']['isVerified'];

// Apply for seller status
final formData = FormData();
formData.files.add(MapEntry('documents', 
  await MultipartFile.fromFile(idDocument.path)));
await dio.post('/api/sellers/apply', data: formData);
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 for process management
3. Configure nginx as reverse proxy
4. Set up MongoDB Atlas for database

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Vercel, Netlify, or AWS S3
3. Configure API endpoints for production

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon
npm test     # Run tests
```

### Frontend Development
```bash
cd admin-dashboard
npm start    # Start development server
npm test     # Run tests
npm run build # Build for production
```

## 📝 API Documentation

Full API documentation is available in the `docs/` folder with request/response examples and authentication details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@mixillo.com or create an issue in the repository.

## 🧪 Testing

This project includes a comprehensive automated test suite with **105 tests** covering backend APIs, data models, and frontend components.

### Quick Test Commands

```powershell
# Run all tests (backend + frontend)
.\run-all-tests.ps1

# Backend tests only
cd backend
npm test                    # All tests
npm run test:coverage       # With coverage
npm run test:integration    # Integration tests
npm run test:unit           # Unit tests

# Frontend tests only
cd admin-dashboard
npm test                    # Interactive mode
npm run test:coverage       # With coverage
npm run test:ci             # CI mode
```

### Test Coverage

- **Backend Integration Tests**: 49 tests (Users, Sellers, Products, Orders, Uploads)
- **Backend Unit Tests**: 33 tests (User, Product, Order models)
- **Frontend Component Tests**: 23 tests (Dashboard, Users, UploadManager)

### Testing Documentation

- 📚 [Full Testing Guide](TESTING_GUIDE.md) - Complete testing documentation
- 📊 [Test Suite Summary](TEST_SUITE_COMPLETE.md) - Detailed overview of all tests
- ⚡ [Quick Reference](TESTING_QUICK_REFERENCE.md) - Common test commands

### CI/CD

Tests run automatically via GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

View test results in the GitHub Actions tab.

---

Built with ❤️ for the Mixillo community
