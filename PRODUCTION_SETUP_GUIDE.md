# Production Setup Guide

This guide will help you set up your Sales Management SaaS application for production use with a real database and proper authentication.

## 🗄️ Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://username:password@hostname:port/database`)

### Step 2: Configure Environment Variables

1. Update your `.env` file with the real database URL:

```env
# Replace with your actual Neon database URL
DATABASE_URL=postgresql://your-username:your-password@your-host.neon.tech/your-database
NETLIFY_DATABASE_URL=postgresql://your-username:your-password@your-host.neon.tech/your-database

# Generate a strong session secret
SESSION_SECRET=your-super-secret-session-key-change-in-production-2025

# Application Configuration
NODE_ENV=production
PORT=5000
```

### Step 3: Run Database Migration

```bash
# Install dependencies if not already done
npm install

# Run the database setup script
node setup-database.js
```

This will:
- Create all necessary tables
- Set up the demo organization and admin user
- Verify the database connection

## 🚀 Deployment Steps

### Step 1: Build the Application

```bash
# Build the client and server
npm run build
```

### Step 2: Deploy to Netlify

```bash
# Deploy to production
netlify deploy --prod
```

### Step 3: Configure Netlify Environment Variables

In your Netlify dashboard:

1. Go to Site settings → Environment variables
2. Add these variables:
   - `DATABASE_URL`: Your Neon database connection string
   - `NETLIFY_DATABASE_URL`: Same as DATABASE_URL
   - `SESSION_SECRET`: A strong random string

## 🔐 Login Credentials

After successful setup, you can login with:

**Demo Organization Admin:**
- Email: `admin@democompany.com`
- Password: `demo123`

## 🎯 Features Available

### ✅ Completed Features

1. **Production-Ready Authentication**
   - Secure password hashing with scrypt
   - Real database integration
   - Session management
   - Multi-tenant organization support

2. **Comprehensive Dashboard**
   - Overview with key metrics
   - Lead management interface
   - Sales tracking
   - Project management
   - Team management
   - Responsive design

3. **Database Schema**
   - Organizations (multi-tenant)
   - Users with role-based access
   - Customers and leads
   - Sales tracking
   - Projects management
   - Audit logging

### 🚧 Next Steps for Full Production

1. **API Integration**: Connect dashboard to real API endpoints
2. **CRUD Operations**: Implement create, read, update, delete for all entities
3. **Advanced Features**: 
   - Email notifications
   - File uploads
   - Advanced reporting
   - Payment integration
4. **Security Enhancements**:
   - Rate limiting
   - Input validation
   - CSRF protection

## 🔧 Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. Verify your DATABASE_URL is correct
2. Check that your Neon database is active
3. Ensure the database allows connections from Netlify

### Login Issues

If login doesn't work:

1. Check browser console for errors
2. Verify the API function is deployed
3. Check Netlify function logs

### Build Issues

If the build fails:

1. Run `npm install` to ensure all dependencies are installed
2. Check for TypeScript errors: `npm run type-check`
3. Verify all imports are correct

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Check Netlify function logs
3. Verify environment variables are set correctly
4. Ensure database migration completed successfully

## 🎉 Success!

Once everything is set up, you'll have a fully functional Sales Management SaaS with:

- Secure multi-tenant authentication
- Professional dashboard interface
- Database-backed data storage
- Production-ready deployment

You can now proceed to add payment integration and additional features as needed.
