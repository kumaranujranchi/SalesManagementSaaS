-- Production Database Setup for Neon
-- Run this script in your Neon SQL Editor or via psql

-- First, run the main migration
-- Copy and paste the contents of saas-migration.sql here, or run it separately

-- Then create a super admin account
-- Replace the values below with your actual details

-- Generate a hashed password using: node hash-password-utility.js yourpassword
-- Then replace 'YOUR_HASHED_PASSWORD_HERE' with the generated hash

INSERT INTO super_admins (
  username, 
  password, 
  full_name, 
  email, 
  role, 
  status,
  created_at,
  updated_at
) VALUES (
  'superadmin',
  'YOUR_HASHED_PASSWORD_HERE',  -- Replace with hashed password
  'Super Administrator',
  'admin@yourdomain.com',       -- Replace with your email
  'super_admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Verify the super admin was created
SELECT id, username, full_name, email, role, status, created_at 
FROM super_admins;

-- Check that all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Sample organization for testing (optional)
-- Uncomment and modify if you want to create a test organization

/*
INSERT INTO organizations (
  name,
  slug,
  address,
  gst_number,
  phone,
  email,
  industry,
  subscription_plan,
  subscription_amount,
  subscription_start_date,
  subscription_end_date,
  max_users,
  created_at,
  updated_at
) VALUES (
  'Test Company',
  'test-company',
  '123 Test Street, Test City, Test State 12345',
  '22AAAAA0000A1Z5',
  '+91 9876543210',
  'admin@testcompany.com',
  'Real Estate',
  'paid',
  6000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  -1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
*/
