# Admin Dashboard API Endpoints Reference

## Backend URL
**Production:** `https://mixillo-backend-52242135857.europe-west1.run.app`
**Local:** `http://localhost:5000`

## Authentication
All admin endpoints require:
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **User Role:** `admin`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | `{identifier, password}` | Login (returns token) |
| POST | `/api/auth/logout` | - | Logout |
| POST | `/api/auth/refresh` | - | Refresh token |
| GET | `/api/users/me` | - | Get current user |

---

## 2. Users Management (`/api/admin/users`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/admin/users` | `limit, offset, status, role, sortBy, order` | Get all users (paginated) |
| GET | `/api/admin/users/search` | `q, limit` | Search users by username/email |
| GET | `/api/users/:id` | - | Get user by ID |
| PUT | `/api/users/:id` | `{user data}` | Update user |
| DELETE | `/api/users/:id` | - | Delete user |
| POST | `/api/admin/users/:id/ban` | `{reason}` | Ban user |
| POST | `/api/admin/users/:id/unban` | - | Unban user |
| POST | `/api/admin/users/:id/verify` | - | Verify user |

---

## 3. Products (`/api/products`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/products` | `page, limit, status, category` | Get all products |
| GET | `/api/products/:id` | - | Get product by ID |
| POST | `/api/products` | `{product data}` | Create product |
| PUT | `/api/products/:id` | `{product data}` | Update product |
| DELETE | `/api/products/:id` | - | Delete product |
| POST | `/api/products/:id/feature` | - | Feature product |
| POST | `/api/products/:id/unfeature` | - | Unfeature product |
| POST | `/api/products/:id/approve` | - | Approve product |
| POST | `/api/products/:id/reject` | `{reason}` | Reject product |
| GET | `/api/products/admin/all` | `page, limit` | Admin: Get all products |
| GET | `/api/products/admin/stats` | - | Admin: Product statistics |
| PUT | `/api/products/admin/:id/status` | `{status}` | Admin: Update product status |
| DELETE | `/api/products/admin/:id` | - | Admin: Force delete product |

---

## 4. Orders (`/api/orders`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/orders` | `page, limit, status` | Get all orders |
| GET | `/api/orders/:id` | - | Get order by ID |
| PUT | `/api/orders/:id/status` | `{status}` | Update order status |
| POST | `/api/orders/:id/refund` | `{reason}` | Refund order |
| POST | `/api/orders/:id/cancel` | `{reason}` | Cancel order |

---

## 5. Content/Videos (`/api/content` & `/api/moderation`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/content` | `page, limit, status` | Get all content |
| GET | `/api/content/:id` | - | Get content by ID |
| DELETE | `/api/content/:id` | - | Delete content |
| POST | `/api/moderation/content/:id/approve` | - | Approve content |
| POST | `/api/moderation/content/:id/reject` | `{reason}` | Reject content |
| POST | `/api/content/:id/feature` | - | Feature content |
| GET | `/api/moderation/queue` | `page, limit` | Get moderation queue |
| GET | `/api/moderation/stats` | - | Get moderation stats |

---

## 6. Stores (`/api/stores`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/stores` | `page, limit, status` | Get all stores |
| GET | `/api/stores/:id` | - | Get store by ID |
| POST | `/api/stores/:id/verify` | - | Verify store |
| POST | `/api/stores/:id/suspend` | `{reason}` | Suspend store |
| DELETE | `/api/stores/:id` | - | Delete store |

---

## 7. Livestreams (`/api/livestreams`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/livestreams` | `page, limit, status` | Get all livestreams |
| GET | `/api/livestreams/:id` | - | Get livestream by ID |
| POST | `/api/livestreams/:id/end` | - | End livestream |
| POST | `/api/livestreams/:id/ban` | `{userId, reason}` | Ban user from livestream |

---

## 8. Wallets & Transactions (`/api/wallets`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/wallets` | `page, limit` | Get all wallets |
| GET | `/api/wallets/:userId` | - | Get user wallet |
| GET | `/api/transactions` | `page, limit, userId` | Get transactions |
| POST | `/api/wallets/:userId/adjust` | `{amount, reason}` | Adjust wallet balance |
| POST | `/api/wallets/:userId/freeze` | `{reason}` | Freeze wallet |
| POST | `/api/wallets/:userId/unfreeze` | - | Unfreeze wallet |

---

## 9. Analytics & Dashboard (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard overview stats |
| GET | `/api/admin/stats` | Get comprehensive statistics |
| GET | `/api/admin/users/stats` | Get user statistics |

---

## 10. Featured Content (`/api/featured`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/featured` | `type, limit` | Get featured items |
| POST | `/api/admin/featured` | `{itemId, type}` | Add to featured |
| DELETE | `/api/admin/featured/:id` | - | Remove from featured |

---

## 11. Reports & Moderation (`/api/moderation`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/moderation/reports` | `page, limit, status` | Get all reports |
| PUT | `/api/moderation/reports/:id/resolve` | `{action, reason}` | Resolve report |

---

## 12. Settings (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/settings/:category` | Get settings by category |
| POST | `/api/admin/settings/:category` | Update settings |

---

## Response Format

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Optional array of errors"]
}
```

---

## Admin Credentials
- **Email:** `admin@mixillo.com`
- **Password:** `Admin@123456`
- **Role:** `admin`
