-- Demo Accounts Setup for Sales Management SaaS
-- Run this script in your Neon database to create demo accounts for testing

-- First, let's create hashed passwords (these are the actual hashes for the demo passwords)
-- SuperAdmin123! = 4b6a04ce8f5b24cd26f1705598315fdaab27ea9116b2783e90bde23adfdd7ce38b63ee5c1aa846b9696fe19c1aeb16842105a34167283c32619386910f40ff23.7a876254766f3786dfdedf62a6414725
-- OrgAdmin123! = 78199c3f97f8603212003767da852e1dd4b24b38a0be29f3aa56d7046015aab7dab8a7ad36b47171509f643f243621cea5125039050ff3ce2d95a7f52ba030c1.8962084780b6474ca96078ecb9fd5ed0
-- Manager123! = bdab4215b2db744c991fffcea90f7cb03cca687c557892051bd98ea003e32591b2082576c9144f71e61c5e803c6b01f8d9e78c5b39c319bba7b12e4c53e5f635.06347e332917ca4bc7d3288784df74a2
-- Sales123! = 6837c3696551977eed1c9fdb6faa21cda17da0e8d3f9c5101970b5b9312bac5f2113ebbd53312c3f012c6d29833d55e8fb17958efbfb0d41fa114653692f93b6.5c515bb7f9848ce4dc9b4b1fcd6acfda

-- 1. Create Super Admin Account
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
  '4b6a04ce8f5b24cd26f1705598315fdaab27ea9116b2783e90bde23adfdd7ce38b63ee5c1aa846b9696fe19c1aeb16842105a34167283c32619386910f40ff23.7a876254766f3786dfdedf62a6414725',
  'Super Administrator',
  'admin@salesmanagement.com',
  'super_admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Demo Organization
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
  'Demo Company Ltd',
  'demo-company',
  '123 Business Street, Tech City, State 12345, India',
  '22AAAAA0000A1Z5',
  '+91 9876543210',
  'admin@democompany.com',
  'Real Estate',
  'paid',
  6000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  -1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO NOTHING;

-- Get the organization ID for the demo company
-- We'll use it in subsequent inserts

-- 3. Create Organization Admin User
INSERT INTO users (
  organization_id,
  username,
  password,
  full_name,
  email,
  phone,
  designation,
  department,
  role,
  permissions,
  status,
  email_verified,
  joining_date,
  monthly_target,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM organizations WHERE slug = 'demo-company'),
  'admin@democompany.com',
  '78199c3f97f8603212003767da852e1dd4b24b38a0be29f3aa56d7046015aab7dab8a7ad36b47171509f643f243621cea5125039050ff3ce2d95a7f52ba030c1.8962084780b6474ca96078ecb9fd5ed0',
  'John Smith',
  'admin@democompany.com',
  '+91 9876543210',
  'Organization Administrator',
  'Administration',
  'org_admin',
  '["manage_organization","view_organization","manage_users","invite_users","view_users","manage_projects","create_projects","view_projects","manage_all_sales","create_sales","view_all_sales","manage_payments","view_payments","manage_targets","view_targets","view_reports","view_analytics","manage_site_visits","approve_site_visits","create_site_visits","view_site_visits","manage_announcements","view_announcements"]',
  true,
  true,
  CURRENT_TIMESTAMP,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email, organization_id) DO NOTHING;

-- 4. Create Sales Manager User
INSERT INTO users (
  organization_id,
  username,
  password,
  full_name,
  email,
  phone,
  designation,
  department,
  role,
  permissions,
  status,
  email_verified,
  joining_date,
  monthly_target,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM organizations WHERE slug = 'demo-company'),
  'manager@democompany.com',
  'bdab4215b2db744c991fffcea90f7cb03cca687c557892051bd98ea003e32591b2082576c9144f71e61c5e803c6b01f8d9e78c5b39c319bba7b12e4c53e5f635.06347e332917ca4bc7d3288784df74a2',
  'Sarah Johnson',
  'manager@democompany.com',
  '+91 9876543211',
  'Sales Manager',
  'Sales',
  'manager',
  '["view_organization","view_users","view_projects","manage_all_sales","create_sales","view_all_sales","view_payments","manage_targets","view_targets","view_reports","view_analytics","approve_site_visits","create_site_visits","view_site_visits","view_announcements"]',
  true,
  true,
  CURRENT_TIMESTAMP,
  5000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email, organization_id) DO NOTHING;

-- 5. Create Sales Executive User
INSERT INTO users (
  organization_id,
  username,
  password,
  full_name,
  email,
  phone,
  designation,
  department,
  role,
  permissions,
  status,
  email_verified,
  joining_date,
  monthly_target,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM organizations WHERE slug = 'demo-company'),
  'sales@democompany.com',
  '6837c3696551977eed1c9fdb6faa21cda17da0e8d3f9c5101970b5b9312bac5f2113ebbd53312c3f012c6d29833d55e8fb17958efbfb0d41fa114653692f93b6.5c515bb7f9848ce4dc9b4b1fcd6acfda',
  'Mike Wilson',
  'sales@democompany.com',
  '+91 9876543212',
  'Sales Executive',
  'Sales',
  'sales_executive',
  '["view_organization","view_projects","manage_own_sales","create_sales","view_own_sales","view_targets","create_site_visits","view_site_visits","view_announcements"]',
  true,
  true,
  CURRENT_TIMESTAMP,
  3000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email, organization_id) DO NOTHING;

-- 6. Create Default Departments for Demo Company
INSERT INTO departments (
  organization_id,
  name,
  description,
  created_at,
  updated_at
) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Sales', 'Sales Department'),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Administration', 'Administrative Department'),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Management', 'Management Team')
ON CONFLICT (name, organization_id) DO NOTHING;

-- 7. Create Default Roles for Demo Company
INSERT INTO roles (
  organization_id,
  name,
  description,
  permissions,
  is_default,
  created_at,
  updated_at
) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Organization Admin', 'Full organization access', '["manage_organization","view_organization","manage_users","invite_users","view_users","manage_projects","create_projects","view_projects","manage_all_sales","create_sales","view_all_sales","manage_payments","view_payments","manage_targets","view_targets","view_reports","view_analytics","manage_site_visits","approve_site_visits","create_site_visits","view_site_visits","manage_announcements","view_announcements"]', true),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Sales Manager', 'Sales team management', '["view_organization","view_users","view_projects","manage_all_sales","create_sales","view_all_sales","view_payments","manage_targets","view_targets","view_reports","view_analytics","approve_site_visits","create_site_visits","view_site_visits","view_announcements"]', true),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Sales Executive', 'Sales creation and management', '["view_organization","view_projects","manage_own_sales","create_sales","view_own_sales","view_targets","create_site_visits","view_site_visits","view_announcements"]', true)
ON CONFLICT (name, organization_id) DO NOTHING;

-- 8. Create Sample Projects for Demo Company
INSERT INTO projects (
  organization_id,
  name,
  description,
  project_type,
  location,
  deadline,
  status,
  created_by,
  created_at,
  updated_at
) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Green Valley Apartments', 'Luxury 2-3 BHK apartments with modern amenities', 'Apartment', 'Green Valley, Sector 12, Gurgaon', CURRENT_TIMESTAMP + INTERVAL '2 years', 'running', (SELECT id FROM users WHERE email = 'admin@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company'))),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Sunrise Villas', 'Premium independent villas with gardens', 'Duplex', 'Sunrise Hills, Sector 45, Noida', CURRENT_TIMESTAMP + INTERVAL '18 months', 'running', (SELECT id FROM users WHERE email = 'admin@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company'))),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), 'Commercial Plaza', 'Commercial spaces for offices and retail', 'Land', 'Business District, Cyber City, Bangalore', CURRENT_TIMESTAMP + INTERVAL '3 years', 'running', (SELECT id FROM users WHERE email = 'admin@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')))
ON CONFLICT DO NOTHING;

-- 9. Create Sample Sales for Demo Company
INSERT INTO sales (
  organization_id,
  sales_executive_id,
  project_id,
  booking_date,
  booking_done,
  customer_name,
  customer_mobile,
  area_sold,
  base_sale_price,
  final_amount,
  amount_paid,
  payment_percentage,
  plot_no,
  status,
  created_by,
  created_at,
  updated_at
) VALUES 
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), (SELECT id FROM users WHERE email = 'sales@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')), (SELECT id FROM projects WHERE name = 'Green Valley Apartments' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')), CURRENT_DATE - INTERVAL '30 days', 'Yes', 'Rajesh Kumar', '+91 9876543213', 1200, 5000, 6000000, 1800000, 30, 'A-101', 'active', (SELECT id FROM users WHERE email = 'sales@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company'))),
  ((SELECT id FROM organizations WHERE slug = 'demo-company'), (SELECT id FROM users WHERE email = 'sales@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')), (SELECT id FROM projects WHERE name = 'Sunrise Villas' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')), CURRENT_DATE - INTERVAL '15 days', 'Yes', 'Priya Sharma', '+91 9876543214', 2500, 8000, 20000000, 5000000, 25, 'V-05', 'active', (SELECT id FROM users WHERE email = 'sales@democompany.com' AND organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')))
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Super Admin Created' as status, count(*) as count FROM super_admins WHERE email = 'admin@salesmanagement.com'
UNION ALL
SELECT 'Organization Created' as status, count(*) as count FROM organizations WHERE slug = 'demo-company'
UNION ALL
SELECT 'Users Created' as status, count(*) as count FROM users WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')
UNION ALL
SELECT 'Projects Created' as status, count(*) as count FROM projects WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')
UNION ALL
SELECT 'Sales Created' as status, count(*) as count FROM sales WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company');

-- Display login information
SELECT 
  'Demo Accounts Created Successfully!' as message,
  'Use these accounts to test the application:' as instructions;

SELECT 
  'Super Admin' as account_type,
  'admin@salesmanagement.com' as email,
  'SuperAdmin123!' as password,
  '/super-admin/login' as login_url;

SELECT 
  'Organization Admin' as account_type,
  'admin@democompany.com' as email,
  'OrgAdmin123!' as password,
  '/login?org=demo-company' as login_url
UNION ALL
SELECT 
  'Sales Manager' as account_type,
  'manager@democompany.com' as email,
  'Manager123!' as password,
  '/login?org=demo-company' as login_url
UNION ALL
SELECT 
  'Sales Executive' as account_type,
  'sales@democompany.com' as email,
  'Sales123!' as password,
  '/login?org=demo-company' as login_url;
