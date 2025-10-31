# Mixillo User Management System

This workspace contains a complete User Management System for the TikTok-style app "mixillo" with:

## Project Structure
- `backend/` - Node.js Express API with MongoDB
- `admin-dashboard/` - React admin panel
- `docs/` - API documentation and schemas

## Key Features
- JWT Authentication for users and admins
- User/Seller role management with verification system
- File uploads for ID/Passport verification
- Admin controls: ban, verify, feature users
- Wallet management and analytics
- Flutter-ready API endpoints

## Development Commands
- Backend: `cd backend && npm run dev`
- Dashboard: `cd admin-dashboard && npm start` 
- Database: MongoDB required

## API Endpoints
- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Sellers: `/api/sellers/*`
- Admin: `/api/admin/*`

## Database Collections
- Users, SellerApplications, Wallets, Strikes, Profiles

Focus on clean code, security, scalability, and modern UI/UX patterns.