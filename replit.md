# replit.md

## Overview

This is a comprehensive **Sales Management System** built for Wishluv Buildcon SalesPro. The application is a full-stack TypeScript project that manages real estate sales operations, including project management, user administration, sales tracking, target management, and performance analytics.

The system features both administrative and user-facing interfaces with role-based access control, supporting different user types from sales executives to system administrators.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Custom design system built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme support
- **Build Tool**: Vite with custom plugins

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Passport.js with local strategy and session management
- **API Design**: RESTful endpoints with TypeScript validation

### Database Strategy
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle with type-safe schema definitions
- **Session Storage**: PostgreSQL-backed sessions
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication & Authorization
- **Strategy**: Session-based authentication with Passport.js
- **Password Security**: Scrypt-based hashing with salt
- **Role System**: Multi-level permissions (Super Admin, Admin, CRM, Sales Representative)
- **Access Control**: Route-level and component-level permission guards

### Sales Management
- **Sales Tracking**: Complete sales lifecycle from booking to payment
- **Project Association**: Sales linked to specific real estate projects
- **Payment Processing**: Multi-installment payment tracking
- **Performance Analytics**: Individual and team performance metrics

### Target & Achievement System
- **Monthly Targets**: Configurable targets based on joining date
- **Achievement Tracking**: Real-time progress monitoring
- **Prorated Calculations**: Targets adjusted for mid-month joiners
- **Historical Analysis**: Year-to-date and cumulative tracking

### User Management
- **Hierarchical Structure**: Reporting manager relationships
- **Department Organization**: Sales, Admin, and other departments
- **Team Groupings**: Sales teams with designated leaders
- **Profile Management**: Complete user profiles with images

### Project Management
- **Project Types**: Land, Apartment, Duplex categories
- **Status Tracking**: Running, closed, on-hold states
- **Location Management**: Geographic project organization
- **Deadline Monitoring**: Project timeline management

### Site Visit Coordination
- **Visit Requests**: Customer site visit scheduling
- **Driver Assignment**: Automated driver allocation
- **Status Tracking**: Approval workflow management
- **Logistics Management**: Pickup locations and project routing

## Data Flow

### Sales Process Flow
1. **Lead Generation**: Sales executives create new sales entries
2. **Project Association**: Sales linked to specific projects
3. **Payment Tracking**: Multiple payment milestones recorded
4. **Achievement Calculation**: Automatic target progress updates
5. **Performance Analytics**: Real-time dashboard updates

### Authentication Flow
1. **Login Request**: Credentials validated against hashed passwords
2. **Session Creation**: Server-side session establishment
3. **Permission Loading**: Role-based permission resolution
4. **Route Protection**: Client-side access control enforcement

### Target Management Flow
1. **Target Assignment**: Monthly targets set during user creation
2. **Achievement Calculation**: Sales data aggregated for progress
3. **Prorated Adjustments**: Mid-month joining date considerations
4. **Historical Tracking**: Cumulative performance analysis

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React Router (Wouter), React Query
- **UI Components**: Radix UI primitives, Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Date Manipulation**: date-fns for date operations

### Backend Dependencies
- **Database**: Neon PostgreSQL, Drizzle ORM
- **Authentication**: Passport.js, express-session
- **Validation**: Zod for runtime type checking
- **Security**: Crypto module for password hashing

### Development Tools
- **Build System**: Vite with TypeScript compilation
- **Type Checking**: TypeScript with strict configuration
- **Code Quality**: ESLint configuration (implied)
- **Development Server**: Vite dev server with HMR

## Deployment Strategy

### Build Process
- **Frontend Build**: Vite builds to `dist/public` directory
- **Backend Build**: ESBuild bundles server to `dist/index.js`
- **Asset Management**: Static assets served from build directory
- **Environment Configuration**: Environment-specific database URLs

### Production Setup
- **Database**: Neon PostgreSQL serverless instance
- **Session Management**: PostgreSQL-backed session store
- **Static Serving**: Express serves built frontend assets
- **Process Management**: Single Node.js process with Express

### Environment Requirements
- **Node.js**: ESM module support required
- **Database URL**: PostgreSQL connection string in environment
- **Session Secret**: Secure session secret configuration
- **Build Assets**: Compiled frontend and backend artifacts

## Changelog
```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```