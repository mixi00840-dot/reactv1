# Mixillo API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.mixillo.com/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "login": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user",
      "status": "active",
      "isVerified": false
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "phone": "+1234567890"
}
```

## User Endpoints

### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "bio": "Updated bio",
  "phone": "+1234567890"
}
```

### Upload Avatar
```http
POST /users/upload-avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

## Seller Endpoints

### Apply for Seller Status
```http
POST /sellers/apply
Authorization: Bearer <token>
Content-Type: multipart/form-data

documentType: "passport"
documentNumber: "AB123456"
documents: <file1>
documents: <file2>
businessName: "My Business"
businessType: "individual"
expectedMonthlyRevenue: 5000
```

### Get Application Status
```http
GET /sellers/status
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "status": {
      "hasApplication": true,
      "status": "pending",
      "submittedAt": "2023-10-01T12:00:00Z",
      "canApply": false
    }
  }
}
```

## Admin Endpoints (Admin Only)

### Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>
```

### Get All Users
```http
GET /admin/users?page=1&limit=20&search=john&status=active
Authorization: Bearer <admin_token>
```

### Update User Status
```http
PUT /admin/users/:userId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "banned",
  "reason": "Violation of terms"
}
```

### Verify User
```http
PUT /admin/users/:userId/verify
Authorization: Bearer <admin_token>
```

### Get Seller Applications
```http
GET /admin/seller-applications?status=pending
Authorization: Bearer <admin_token>
```

### Approve Seller Application
```http
PUT /admin/seller-applications/:applicationId/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "notes": "Documents verified successfully"
}
```

### Reject Seller Application
```http
PUT /admin/seller-applications/:applicationId/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Invalid documents",
  "notes": "Passport image is not clear"
}
```

### Issue Strike
```http
POST /admin/strikes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user_id",
  "type": "warning",
  "severity": "medium",
  "reason": "Inappropriate content",
  "actionTaken": "content_removed",
  "description": "Posted inappropriate video content"
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## File Upload Limits

- Maximum file size: 10MB
- Allowed image formats: JPEG, PNG, GIF, WebP
- Allowed document formats: JPEG, PNG, PDF
- Maximum files per request: 5

## Pagination

List endpoints support pagination:
```
?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

Response includes pagination info:
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```