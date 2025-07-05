# 🚀 Deployment Guide: GitHub + Netlify + Neon

This guide will help you deploy your Sales Management SaaS application using GitHub, Netlify, and Neon database.

## 📋 Prerequisites

- GitHub account
- Netlify account
- Neon database account (free tier available)

## 🗄️ Step 1: Set Up Neon Database

### 1. Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Choose a region close to your users

### 2. Get Database Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string (it looks like):
   ```
   postgresql://username:password@hostname/database?sslmode=require
   ```
3. Save this for later - you'll need it in Netlify

### 3. Run Database Migration
1. Use the Neon SQL Editor or connect via psql:
   ```bash
   psql "your_neon_connection_string" -f saas-migration.sql
   ```
2. This creates all the necessary tables for multi-tenancy

## 📂 Step 2: Push to GitHub

### 1. Initialize Git Repository
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Sales Management SaaS"
```

### 2. Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `sales-management-saas`
4. Don't initialize with README (we already have one)
5. Create repository

### 3. Push to GitHub
```bash
# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sales-management-saas.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Step 3: Deploy on Netlify

### 1. Connect GitHub to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login
3. Click "New site from Git"
4. Choose "GitHub"
5. Select your `sales-management-saas` repository

### 2. Configure Build Settings
Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Build command**: `npm run build:netlify`
- **Publish directory**: `dist/public`
- **Functions directory**: `netlify/functions`

### 3. Set Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:

```env
DATABASE_URL=your_neon_connection_string_here
SESSION_SECRET=your_super_secret_session_key_here
NODE_ENV=production
```

**Important**: 
- Use the Neon connection string from Step 1
- Generate a secure session secret (random 32+ character string)

### 4. Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Your site will be available at: `https://random-name.netlify.app`

## 🔧 Step 4: Configure Custom Domain (Optional)

### 1. Add Custom Domain
1. In Netlify dashboard → Domain settings
2. Click "Add custom domain"
3. Enter your domain: `yourdomain.com`

### 2. Configure DNS
Point your domain to Netlify:
- **A Record**: `75.2.60.5`
- **AAAA Record**: `2600:1f14:e22:d200::1`

### 3. Enable Wildcard Subdomain
For organization subdomains (`company.yourdomain.com`):
1. Add wildcard DNS: `*.yourdomain.com` → Netlify
2. In Netlify, add domain: `*.yourdomain.com`

## 🔐 Step 5: Initialize Super Admin

### 1. Create Super Admin Account
Since we can't run scripts directly on Netlify, create super admin via database:

1. Connect to your Neon database
2. Run this SQL (replace with your details):
```sql
INSERT INTO super_admins (username, password, full_name, email, role, status)
VALUES (
  'superadmin',
  'your_hashed_password_here',
  'Super Administrator', 
  'admin@yourdomain.com',
  'super_admin',
  true
);
```

### 2. Hash Password
Use this Node.js script to hash your password:
```javascript
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Usage
console.log(await hashPassword('your_password_here'));
```

## 🎯 Step 6: Test Your Deployment

### 1. Access Points
- **Landing Page**: `https://yourdomain.com`
- **Super Admin**: `https://yourdomain.com/super-admin/login`
- **API**: `https://yourdomain.com/api`

### 2. Create First Organization
1. Login as super admin
2. Create a test organization
3. Test organization login at: `https://company.yourdomain.com`

## 🔄 Step 7: Continuous Deployment

Now every time you push to GitHub:
1. Netlify automatically rebuilds
2. Changes are deployed instantly
3. Zero downtime deployments

## 📊 Monitoring & Analytics

### Netlify Analytics
- Enable in Netlify dashboard
- Track visitors, page views, bandwidth

### Database Monitoring
- Monitor in Neon dashboard
- Set up alerts for usage limits

## 🛠️ Troubleshooting

### Build Failures
1. Check Netlify build logs
2. Verify environment variables
3. Test build locally: `npm run build:netlify`

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check Neon database is active
3. Ensure SSL mode is enabled

### Function Errors
1. Check Netlify function logs
2. Verify serverless-express setup
3. Test API endpoints

## 🔒 Security Checklist

- ✅ Environment variables set in Netlify
- ✅ Database connection uses SSL
- ✅ Session secret is secure and random
- ✅ HTTPS enabled (automatic with Netlify)
- ✅ Security headers configured in netlify.toml

## 📈 Scaling Considerations

### Database
- Neon free tier: 0.5 GB storage, 1 compute unit
- Upgrade to Pro for more resources
- Consider read replicas for high traffic

### Netlify
- Free tier: 100 GB bandwidth, 300 build minutes
- Upgrade to Pro for more resources
- Consider Netlify Edge Functions for better performance

## 🆘 Support

If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test database connection
4. Check GitHub repository settings

Your Sales Management SaaS is now live and ready for production use! 🎉
