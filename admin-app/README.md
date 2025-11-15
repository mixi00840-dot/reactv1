# Mixillo Admin App (Next.js 14)

Fresh admin dashboard scaffold using Next.js 14 + TypeScript + Tailwind + Zustand + Axios + TanStack Table + Socket.IO.

## Quick Start

1. Install deps

```powershell
cd admin-app
npm install
```

2. Set environment

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app
NEXT_PUBLIC_SOCKET_URL=https://mixillo-backend-52242135857.europe-west1.run.app
```

3. Run dev server

```powershell
npm run dev
```

4. Login

- Email: `admin@mixillo.com`
- Password: `Test@123`

## Pages Implemented

### Core Management
- **Dashboard** – Key metrics (users, stores, products, orders, revenue)
- **Users** – User list with filters (role, status, search)
- **Stores** – Store management with verification status
- **Products** – Product catalog with status filters
- **Orders** – Order tracking with status management

### E-commerce & Finance
- **Payments** – Payment transactions with filters
- **Coupons** – Discount code management
- **Wallets** – User wallet balances
- **Transactions** – Transaction history with filters

### Monetization
- **Coin Packages** – Virtual currency packages
- **Levels** – User levels and badges
- **Banners** – Promotional banner management

### Content & Moderation
- **Content** – Video/content list with status actions (activate/deactivate/ban)
- **Comments** – Comment moderation with approve/reject/spam actions
- **Featured** – Featured content management
- **Tags** – Tag management with create form
- **Sounds** – Sound library with search

### Analytics & System
- **Analytics** – User growth, content stats, sales, engagement metrics
- **System** – MongoDB/Redis status, streaming providers

## Structure

- `src/app/(auth)/login` – login page
- `src/app/(protected)/layout.tsx` – protected layout with nav
- `src/app/(protected)/{page}` – admin pages (20+ implemented)
- `src/lib/api.ts` – Axios client with token interceptor
- `src/components/data-table/DataTable.tsx` – TanStack Table wrapper with sorting/pagination
- `src/components/ui/*` – minimal UI primitives (button, input, card, table)
- `src/lib/socket.ts` – Socket.IO client
- `src/components/NotificationsBell.tsx` – real-time notifications badge
- `src/components/ThemeToggle.tsx` – dark mode switcher
- `src/stores/notificationStore.ts` – Zustand store for notifications

## Features

- **Authentication**: JWT token via cookie, middleware route protection
- **Data Tables**: TanStack Table with server-side pagination, sorting, search
- **Moderation Actions**: Inline approve/reject/ban buttons with API calls
- **Real-time**: Socket.IO integration with notification bell badge
- **Dark Mode**: CSS variables + Tailwind dark mode with toggle
- **Responsive**: Mobile-friendly tables and cards

## Backend Endpoints Used

All endpoints require `Authorization: Bearer <token>` header:

- `GET /api/admin/dashboard` – Dashboard stats
- `GET /api/admin/users` – User list
- `GET /api/admin/stores` – Store list
- `GET /api/products` – Product list
- `GET /api/orders` – Order list
- `GET /api/payments/admin/all` – Payment transactions
- `GET /api/coupons` – Coupons
- `GET /api/admin/wallets` – Wallets
- `GET /api/admin/wallets/transactions` – Transactions
- `GET /api/admin/coin-packages` – Coin packages
- `GET /api/admin/levels` – User levels
- `GET /api/admin/banners` – Banners
- `GET /api/admin/content` – Content list
- `GET /api/admin/comments` – Comment list
- `GET /api/admin/featured` – Featured items
- `GET /api/admin/tags` – Tags
- `GET /api/sounds` – Sounds
- `GET /api/admin/analytics` – Analytics data
- `GET /api/admin/database/stats` – System metrics
- `PUT /api/admin/content/:id/status` – Update content status
- `PUT /api/admin/comments/:id/status` – Approve/reject comments
- `POST /api/admin/tags` – Create tag

## Notes

- Middleware protects protected routes via `token` cookie.
- Replace API URL if your Cloud Run URL differs.
- Backend CORS must allow admin app origin.
- Seeded admin credentials: `admin@mixillo.com` / `Test@123`
