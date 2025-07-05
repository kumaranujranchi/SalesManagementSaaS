-- SaaS Multi-tenant Migration Script
-- This script converts the single-tenant application to multi-tenant SaaS

-- Create organizations table (tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo TEXT,
  address TEXT NOT NULL,
  gst_number TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  subscription_plan TEXT DEFAULT 'paid',
  subscription_status TEXT DEFAULT 'active',
  subscription_amount NUMERIC DEFAULT 6000,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  max_users INTEGER DEFAULT -1,
  settings TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create super_admins table (platform administrators)
CREATE TABLE IF NOT EXISTS super_admins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'super_admin',
  status BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  invited_by INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add organization_id to existing tables
DO $$
BEGIN
    -- Add organization_id to users table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE users ADD COLUMN organization_id INTEGER;
        ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}';
        ALTER TABLE users ADD COLUMN invited_by INTEGER;
        ALTER TABLE users ADD COLUMN invited_at TIMESTAMP;
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        ALTER TABLE users ADD COLUMN email_verification_token TEXT;
        ALTER TABLE users ADD COLUMN password_reset_token TEXT;
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Remove unique constraint from username and employee_id to allow per-organization uniqueness
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employee_id_key;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    END IF;

    -- Add organization_id to projects table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN organization_id INTEGER;
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add organization_id to departments table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE departments ADD COLUMN organization_id INTEGER;
        ALTER TABLE departments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE departments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Remove unique constraint from name to allow per-organization uniqueness
        ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_name_key;
    END IF;

    -- Add organization_id to roles table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE roles ADD COLUMN organization_id INTEGER;
        ALTER TABLE roles ADD COLUMN is_default BOOLEAN DEFAULT false;
        ALTER TABLE roles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE roles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Remove unique constraint from name to allow per-organization uniqueness
        ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key;
    END IF;

    -- Add organization_id to activities table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE activities ADD COLUMN organization_id INTEGER;
    END IF;

    -- Add organization_id to leaderboard table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN organization_id INTEGER;
        ALTER TABLE leaderboard ADD COLUMN period TEXT;
        ALTER TABLE leaderboard ADD COLUMN year INTEGER;
        ALTER TABLE leaderboard ADD COLUMN month INTEGER;
        ALTER TABLE leaderboard ADD COLUMN quarter INTEGER;
        ALTER TABLE leaderboard ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add organization_id to announcements table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'announcements' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE announcements ADD COLUMN organization_id INTEGER;
        ALTER TABLE announcements ADD COLUMN is_active BOOLEAN DEFAULT true;
        ALTER TABLE announcements ADD COLUMN expires_at TIMESTAMP;
        ALTER TABLE announcements ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Fix created_at column type if it's text
        ALTER TABLE announcements ALTER COLUMN created_at TYPE TIMESTAMP USING created_at::timestamp;
        ALTER TABLE announcements ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add organization_id to sales table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN organization_id INTEGER;
        ALTER TABLE sales ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add organization_id to payments table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN organization_id INTEGER;
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add organization_id to targets table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'targets' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE targets ADD COLUMN organization_id INTEGER;
    END IF;

    -- Add organization_id to incentives table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'incentives' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE incentives ADD COLUMN organization_id INTEGER;
    END IF;

    -- Add organization_id to incentive_payouts table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'incentive_payouts' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE incentive_payouts ADD COLUMN organization_id INTEGER;
    END IF;

    -- Add organization_id to site_visits table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'site_visits' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE site_visits ADD COLUMN organization_id INTEGER;
    END IF;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email_organization ON users(email, organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_organization_id ON sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_targets_organization_id ON targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_organization_id ON announcements(organization_id);

-- Create unique constraints for per-organization uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_org ON users(username, organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_org ON users(email, organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_id_org ON users(employee_id, organization_id) WHERE employee_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_name_org ON departments(name, organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name_org ON roles(name, organization_id);

-- Insert default super admin (update password hash as needed)
INSERT INTO super_admins (username, password, full_name, email, role) 
VALUES ('superadmin', 'your_hashed_password_here', 'Super Administrator', 'admin@yoursaas.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;

COMMIT;
