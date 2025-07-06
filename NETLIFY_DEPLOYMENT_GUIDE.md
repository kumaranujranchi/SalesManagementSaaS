# 🚀 Netlify Deployment Guide for SalesManagementSaaS

## Prerequisites
- GitHub/GitLab repository with your code
- Neon Database account
- Netlify account

## 📋 Step-by-Step Deployment

### 1. Set Up Neon Database

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for a free account
   - Create a new project

2. **Get Database Connection String**
   - In your Neon dashboard, go to "Connection Details"
   - Copy the connection string (it looks like):
   ```
   postgresql://username:password@hostname/database?sslmode=require
   ```

3. **Set Up Database Schema**
   - In Neon SQL Editor, run the contents of `saas-migration.sql`
   - Or use the command: `psql "YOUR_DATABASE_URL" -f saas-migration.sql`

### 2. Deploy to Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub/GitLab account
   - Select your SalesManagementSaaS repository

2. **Configure Build Settings**
   - Build command: `npm run build:netlify`
   - Publish directory: `dist/public`
   - Functions directory: `netlify/functions`
   - (These should auto-populate from netlify.toml)

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add these required variables:

   ```
   DATABASE_URL = your_neon_connection_string
   SESSION_SECRET = generate_a_secure_random_string_32_chars_minimum
   NODE_ENV = production
   ```

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (usually 2-3 minutes)

### 3. Post-Deployment Setup

1. **Create Super Admin Account**
   - Use the hash-password utility: `node hash-password-utility.js yourpassword`
   - Run the setup script in Neon SQL Editor with your hashed password

2. **Test Your Application**
   - Visit your Netlify URL
   - Test super admin login at `/super-admin/login`
   - Create a test organization
   - Verify all functionality works

## 🔧 Environment Variables Reference

### Required Variables
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `SESSION_SECRET`: Secure random string (32+ characters)
- `NODE_ENV`: Set to `production`

### Optional Variables
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: For email invitations
- `BASE_DOMAIN`: For custom domain setup
- `MAX_FILE_SIZE`, `UPLOAD_PATH`: For file uploads

## 🔍 Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure SSL mode is enabled

### Function Errors
- Check function logs in Netlify dashboard
- Verify serverless function configuration
- Test API endpoints manually

## 📱 Connecting to Neon Dashboard

### Access Your Database
1. **Neon Console**: [console.neon.tech](https://console.neon.tech)
2. **SQL Editor**: Run queries directly in browser
3. **Connection Details**: Get connection strings for different environments
4. **Monitoring**: View database metrics and performance
5. **Branching**: Create database branches for development

### Database Management
- **Schema Changes**: Use Drizzle migrations or SQL Editor
- **Data Backup**: Neon provides automatic backups
- **Scaling**: Upgrade plan for higher limits
- **Monitoring**: View query performance and usage

## 🎉 Success!
Your SalesManagementSaaS is now live on Netlify with Neon Database!

Visit your Netlify URL to start using your application.
