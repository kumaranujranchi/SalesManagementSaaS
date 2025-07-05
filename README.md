# Sales Management SaaS Platform

A comprehensive multi-tenant SaaS sales management platform converted from Wishluv Buildcon's single-tenant system. This platform supports multiple organizations with complete data isolation, role-based access control, and admin-managed client onboarding.

## 🚀 Key Features

### Multi-Tenancy
- **Complete Data Isolation**: Each organization's data is completely separated
- **Subdomain Support**: Each organization gets `company.yourdomain.com`
- **Admin-Managed Onboarding**: Super admins create and manage client organizations
- **Flat Pricing**: ₹6,000 annually per organization

### Architecture
- **Landing Page**: Main domain for marketing and contact
- **Organization Dashboards**: Subdomains for client access
- **Super Admin Portal**: Platform management interface

### Authentication & Authorization
- **Role-Based Access Control**: Granular permissions system
- **Organization Admin**: Full control over organization settings and users
- **User Invitations**: Email-based user onboarding
- **Session Management**: Secure session handling with PostgreSQL storage

### Sales Management
- **Sales Tracking**: Complete sales lifecycle management
- **Project Association**: Link sales to specific projects
- **Payment Processing**: Multi-installment payment tracking
- **Target Management**: Monthly targets with achievement tracking

### User Management
- **Hierarchical Structure**: Reporting manager relationships
- **Department Organization**: Team-based user grouping
- **Profile Management**: Complete user profiles with images
- **Activity Logging**: Audit trail for all user actions

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express.js
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication
- **Session-based** authentication with PostgreSQL storage

### Database
- **PostgreSQL** (Neon serverless recommended)
- **Multi-tenant schema** with organization isolation
- **Audit logging** for compliance and tracking

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- npm or yarn

### 1. Clone and Install
```bash
git clone <repository-url>
cd SalesManagementSaaS
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://username:password@hostname:port/database
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=development
```

### 3. Database Setup
```bash
# Run the multi-tenant migration
psql $DATABASE_URL -f saas-migration.sql

# Or use Drizzle migrations
npm run db:push
```

### 4. Development
```bash
# Start development server
npm run dev

# The app will be available at:
# - Main app: http://localhost:5000
# - API: http://localhost:5000/api
```

### 5. Production Build
```bash
npm run build
npm start
```

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)
See detailed guide in `DEPLOYMENT.md`

**Quick Steps:**
1. Push code to GitHub
2. Connect GitHub to Netlify
3. Set up Neon database
4. Configure environment variables
5. Deploy automatically

### Option 2: Vercel
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Environment Variables (Required)
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `SESSION_SECRET`: A secure random string
- `NODE_ENV`: `production`

## 📋 Usage

### Organization Registration
1. Visit `/register` to create a new organization
2. Fill in organization details and admin information
3. System creates organization with default roles and departments
4. Admin can then invite users

### User Onboarding
1. Organization admin invites users via email
2. Users receive invitation link
3. Users complete registration with invitation token
4. Automatic role assignment based on invitation

### Multi-Tenant Access
- **Subdomain**: `https://company.yourdomain.com`
- **Path-based**: `https://yourdomain.com/org/company`
- **Query parameter**: `https://yourdomain.com/login?org=company`

## 🔐 Security Features

### Data Isolation
- All database queries include organization filter
- Middleware enforces tenant context
- No cross-organization data access

### Authentication
- Scrypt password hashing with salt
- Session-based authentication
- CSRF protection
- Rate limiting (recommended to add)

### Authorization
- Role-based permissions system
- Resource-level access control
- Audit logging for compliance

## 🎯 Role System

### Default Roles
- **Organization Admin**: Full organization control
- **Manager**: Team management and oversight
- **Sales Executive**: Sales creation and management
- **User**: Basic access to own data
- **Viewer**: Read-only access

### Permissions
- Granular permission system
- Customizable per organization
- Inheritance and override support

## 📊 Database Schema

### Core Tables
- `organizations`: Tenant/organization data
- `users`: User accounts with organization reference
- `roles`: Organization-specific roles
- `departments`: Organization departments
- `projects`: Sales projects
- `sales`: Sales transactions
- `payments`: Payment tracking
- `targets`: Sales targets and achievements

### Multi-Tenant Design
- All tables include `organization_id` for isolation
- Unique constraints scoped to organization
- Cascade deletes for data cleanup

## 🔧 Development

### Adding New Features
1. Update database schema in `shared/schema.ts`
2. Add organization_id to new tables
3. Update middleware for proper filtering
4. Add appropriate permissions

### Testing Multi-Tenancy
1. Create multiple organizations
2. Test data isolation between tenants
3. Verify permission enforcement
4. Test user invitation flow

## 📈 Monitoring & Analytics

### Audit Logging
- All user actions logged
- Organization-level activity tracking
- Compliance and security monitoring

### Performance
- Database indexing for multi-tenant queries
- Session optimization
- Query performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the audit logs for debugging

---

**Note**: This application has been successfully converted from a single-tenant to multi-tenant SaaS platform with complete data isolation, role-based access control, and organization management capabilities.
