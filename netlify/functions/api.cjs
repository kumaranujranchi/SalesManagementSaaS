const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
const { promisify } = require("util");

// Database connection
const databaseUrl =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

// For demo purposes, allow the function to work without database
let sql = null;
if (databaseUrl) {
  sql = neon(databaseUrl);
} else {
  console.warn("No database URL configured. Using demo mode.");
}

const scryptAsync = promisify(crypto.scrypt);

// Password hashing utilities
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, hashedPassword) {
  const [salt, key] = hashedPassword.split(":");
  const derivedKey = await scryptAsync(password, salt, 64);
  return key === derivedKey.toString("hex");
}

// Database initialization
async function initializeDatabase() {
  if (!sql) {
    console.log("Database not configured, using demo mode");
    return true; // Allow the app to continue in demo mode
  }

  try {
    // Check if organizations table exists
    const orgCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
      );
    `;

    if (!orgCheck[0].exists) {
      console.log(
        "Database tables not found. Please run the migration script first."
      );
      return false;
    }

    // Check if demo organization exists
    const demoOrg = await sql`
      SELECT * FROM organizations WHERE slug = 'demo-company' LIMIT 1;
    `;

    if (demoOrg.length === 0) {
      // Create demo organization
      const [newOrg] = await sql`
        INSERT INTO organizations (
          name, slug, address, gst_number, phone, email, industry,
          subscription_plan, subscription_status, subscription_amount,
          max_users, created_at, updated_at
        ) VALUES (
          'Demo Company', 'demo-company', '123 Demo Street', 'DEMO123456789',
          '+1234567890', 'admin@democompany.com', 'Technology',
          'paid', 'active', 6000, 50, NOW(), NOW()
        ) RETURNING *;
      `;

      // Create demo admin user
      const hashedPassword = await hashPassword("demo123");
      await sql`
        INSERT INTO users (
          organization_id, username, password, full_name, email, phone,
          role, status, created_at, updated_at
        ) VALUES (
          ${newOrg.id}, 'admin@democompany.com', ${hashedPassword},
          'Demo Administrator', 'admin@democompany.com', '+1234567890',
          'org_admin', true, NOW(), NOW()
        );
      `;

      console.log("Demo organization and admin created successfully");
    }

    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    return false;
  }
}

exports.handler = async (event, context) => {
  try {
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Database not initialized. Please run migrations first.",
        }),
      };
    }

    console.log("=== API FUNCTION CALLED ===");
    console.log("Event path:", event.path);
    console.log("Event httpMethod:", event.httpMethod);
    console.log("Event body:", event.body);
    console.log("Database URL configured:", !!databaseUrl);
    console.log("=== END DEBUG INFO ===");

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Credentials": "true",
        },
        body: "",
      };
    }

    // Handle specific routes
    if (
      event.path === "/health" ||
      event.path === "/api/health" ||
      event.path === "/.netlify/functions/api/health"
    ) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          status: "ok",
          message: "API is working with Express integration",
          timestamp: new Date().toISOString(),
          path: event.path,
          method: event.httpMethod,
        }),
      };
    }

    // Handle database setup endpoint
    if (
      event.path === "/setup" ||
      event.path === "/api/setup" ||
      event.path === "/.netlify/functions/api/setup"
    ) {
      if (event.httpMethod === "POST") {
        try {
          console.log("Setting up database...");

          // Check environment variables first
          const databaseUrl =
            process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

          console.log("Database URL available:", !!databaseUrl);

          if (!databaseUrl) {
            throw new Error("Database URL not found in environment variables");
          }

          // Initialize database connection
          const setupSql = neon(databaseUrl);

          console.log("Running database migration...");

          // Create organizations table
          await setupSql`
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
          `;

          // Create super_admins table
          await setupSql`
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
          `;

          // Create users table
          await setupSql`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              username TEXT NOT NULL,
              password TEXT NOT NULL,
              full_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              designation TEXT,
              department TEXT,
              reporting_manager TEXT,
              reporting_manager_id INTEGER,
              team TEXT,
              image_url TEXT,
              role TEXT DEFAULT 'user',
              permissions TEXT DEFAULT '{}',
              status BOOLEAN DEFAULT true,
              employee_id TEXT,
              joining_date TIMESTAMP,
              monthly_target DOUBLE PRECISION,
              invited_by INTEGER REFERENCES users(id),
              invited_at TIMESTAMP,
              last_login TIMESTAMP,
              email_verified BOOLEAN DEFAULT false,
              email_verification_token TEXT,
              password_reset_token TEXT,
              password_reset_expires TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          console.log("Creating demo super admin account...");

          // Insert demo super admin account
          await setupSql`
            INSERT INTO super_admins (
              username, password, full_name, email, role, status, created_at, updated_at
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
          `;

          console.log("Creating demo organization...");

          // Insert demo organization
          await setupSql`
            INSERT INTO organizations (
              name, slug, address, phone, email, industry, created_at, updated_at
            ) VALUES (
              'Demo Company',
              'demo-company',
              '123 Demo Street, Demo City',
              '+1234567890',
              'admin@democompany.com',
              'Real Estate',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            ) ON CONFLICT (slug) DO NOTHING;
          `;

          // Get the demo organization ID
          const demoOrg = await setupSql`
            SELECT id FROM organizations WHERE slug = 'demo-company' LIMIT 1;
          `;

          if (demoOrg.length > 0) {
            console.log("Creating demo user account...");

            // Insert demo user account
            await setupSql`
              INSERT INTO users (
                organization_id, username, password, full_name, email, role, status, created_at, updated_at
              ) VALUES (
                ${demoOrg[0].id},
                'admin',
                '6837c3696551977eed1c9fdb6faa21cda17da0e8d3f9c5101970b5b9312bac5f2113ebbd53312c3f012c6d29833d55e8fb17958efbfb0d41fa114653692f93b6.5c515bb7f9848ce4dc9b4b1fcd6acfda',
                'Demo Admin',
                'admin@democompany.com',
                'org_admin',
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              ) ON CONFLICT (email) DO NOTHING;
            `;
          }

          console.log("Creating additional tables...");

          // Create projects table
          await setupSql`
            CREATE TABLE IF NOT EXISTS projects (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              description TEXT,
              project_type TEXT NOT NULL,
              image_url TEXT,
              location TEXT NOT NULL,
              deadline TIMESTAMP,
              status TEXT DEFAULT 'running',
              created_by INTEGER NOT NULL REFERENCES users(id),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create sales table
          await setupSql`
            CREATE TABLE IF NOT EXISTS sales (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              sales_executive_id INTEGER NOT NULL REFERENCES users(id),
              project_id INTEGER NOT NULL REFERENCES projects(id),
              booking_date DATE NOT NULL,
              booking_done TEXT DEFAULT 'No',
              booking_data TEXT,
              agreement_date DATE,
              customer_name TEXT NOT NULL,
              customer_phone TEXT NOT NULL,
              customer_email TEXT,
              customer_address TEXT,
              plot_number TEXT,
              plot_area DOUBLE PRECISION,
              plot_rate DOUBLE PRECISION,
              plot_cost DOUBLE PRECISION,
              booking_amount DOUBLE PRECISION,
              payment_mode TEXT,
              payment_details TEXT,
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create targets table
          await setupSql`
            CREATE TABLE IF NOT EXISTS targets (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              year INTEGER NOT NULL,
              month INTEGER NOT NULL,
              target_value DOUBLE PRECISION NOT NULL,
              achieved DOUBLE PRECISION DEFAULT 0,
              last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create announcements table
          await setupSql`
            CREATE TABLE IF NOT EXISTS announcements (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              created_by INTEGER NOT NULL REFERENCES users(id),
              is_active BOOLEAN DEFAULT true,
              expires_at TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create leaderboard table
          await setupSql`
            CREATE TABLE IF NOT EXISTS leaderboard (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              achievement TEXT NOT NULL,
              score INTEGER DEFAULT 0,
              period TEXT,
              year INTEGER,
              month INTEGER,
              quarter INTEGER,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create site_visits table
          await setupSql`
            CREATE TABLE IF NOT EXISTS site_visits (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              sales_executive_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              customer_name TEXT NOT NULL,
              visit_date DATE NOT NULL,
              visit_time TEXT NOT NULL,
              pickup_location TEXT NOT NULL,
              project_ids TEXT NOT NULL,
              notes TEXT,
              status TEXT DEFAULT 'pending',
              approved_by INTEGER REFERENCES users(id),
              approved_at TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create organization_invitations table
          await setupSql`
            CREATE TABLE IF NOT EXISTS organization_invitations (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              email TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'user',
              invited_by INTEGER NOT NULL REFERENCES users(id),
              token TEXT NOT NULL UNIQUE,
              expires_at TIMESTAMP NOT NULL,
              accepted_at TIMESTAMP,
              status TEXT DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;

          // Create unique indexes
          await setupSql`
            CREATE UNIQUE INDEX IF NOT EXISTS targets_user_year_month_idx ON targets (user_id, year, month);
          `;

          console.log("Database setup completed successfully!");

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              message: "Database setup completed successfully!",
              credentials: {
                superAdmin: {
                  email: "admin@salesmanagement.com",
                  password: "SuperAdmin123!",
                },
                orgAdmin: {
                  email: "admin@democompany.com",
                  password: "Sales123!",
                },
              },
            }),
          };
        } catch (setupError) {
          console.error("Setup error:", setupError);
          return {
            statusCode: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: "Setup failed",
              message: setupError.message,
              stack: setupError.stack,
            }),
          };
        }
      }
    }

    // Route to Express app for API calls
    if (
      event.path.startsWith("/auth/") ||
      event.path.startsWith("/api/auth/") ||
      event.path.startsWith("/.netlify/functions/api/auth/")
    ) {
      // Extract the actual API path
      let apiPath = event.path;
      if (apiPath.startsWith("/.netlify/functions/api")) {
        apiPath = apiPath.replace("/.netlify/functions/api", "");
      } else if (apiPath.startsWith("/api")) {
        apiPath = apiPath.replace("/api", "");
      }

      console.log("Routing to Express app:", apiPath);

      // For now, handle super admin login directly
      if (
        apiPath === "/auth/super-admin/login" &&
        event.httpMethod === "POST"
      ) {
        try {
          const body = JSON.parse(event.body || "{}");
          console.log("Super admin login attempt:", { email: body.email });

          // For demo purposes, check against the known credentials
          if (
            body.email === "admin@salesmanagement.com" &&
            body.password === "SuperAdmin123!"
          ) {
            return {
              statusCode: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
              body: JSON.stringify({
                admin: {
                  id: 1,
                  username: "superadmin",
                  full_name: "Super Administrator",
                  email: "admin@salesmanagement.com",
                  role: "super_admin",
                  status: true,
                },
                permissions: ["super_admin"],
                message:
                  "Login successful! Note: This is using demo credentials. Please set up the database properly for production.",
              }),
            };
          } else {
            return {
              statusCode: 401,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
              body: JSON.stringify({
                error: "Invalid credentials",
                hint: "Use admin@salesmanagement.com / SuperAdmin123!",
              }),
            };
          }
        } catch (dbError) {
          console.error("Login error:", dbError);
          return {
            statusCode: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: "Login error",
              message: dbError.message,
            }),
          };
        }
      }
    }

    // Handle organization admin login and regular login
    if (
      (event.path === "/auth/org-admin/login" ||
        event.path === "/api/auth/org-admin/login" ||
        event.path === "/.netlify/functions/api/auth/org-admin/login" ||
        event.path === "/auth/login" ||
        event.path === "/api/auth/login" ||
        event.path === "/.netlify/functions/api/auth/login") &&
      event.httpMethod === "POST"
    ) {
      try {
        const body = JSON.parse(event.body || "{}");
        const { email, password } = body;

        console.log("Organization admin login attempt:", { email });

        if (!email || !password) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: "Email and password are required",
            }),
          };
        }

        // Demo mode - allow login with demo credentials
        if (!sql) {
          if (email === "admin@democompany.com" && password === "demo123") {
            return {
              statusCode: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
              body: JSON.stringify({
                success: true,
                user: {
                  id: 1,
                  email: "admin@democompany.com",
                  name: "Demo Admin",
                  role: "org_admin",
                  organization_name: "Demo Company",
                  organization_slug: "demo-company",
                },
                organization: {
                  id: 1,
                  name: "Demo Company",
                  slug: "demo-company",
                },
                token: "demo-token-123",
              }),
            };
          } else {
            return {
              statusCode: 401,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
              body: JSON.stringify({
                error: "Invalid credentials",
                hint: "Demo credentials: admin@democompany.com / demo123",
              }),
            };
          }
        }

        // Find user in database
        const users = await sql`
          SELECT u.*, o.name as organization_name, o.slug as organization_slug
          FROM users u
          JOIN organizations o ON u.organization_id = o.id
          WHERE u.email = ${email} AND u.role = 'org_admin' AND u.status = true
          LIMIT 1;
        `;

        console.log("Found users:", users.length);

        if (users.length === 0) {
          return {
            statusCode: 401,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: "Invalid credentials",
              hint: "Demo credentials: admin@democompany.com / demo123",
            }),
          };
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
          return {
            statusCode: 401,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: "Invalid credentials",
            }),
          };
        }

        // Update last login
        await sql`
          UPDATE users
          SET last_login = NOW()
          WHERE id = ${user.id};
        `;

        // Get organization details
        const organizations = await sql`
          SELECT * FROM organizations WHERE id = ${user.organization_id} LIMIT 1;
        `;

        const organization = organizations[0];

        // Return success response
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            user: {
              id: user.id,
              username: user.username,
              fullName: user.full_name,
              email: user.email,
              role: user.role,
              status: user.status,
              organizationId: user.organization_id,
            },
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              industry: organization.industry,
              subscriptionPlan: organization.subscription_plan,
              subscriptionStatus: organization.subscription_status,
            },
            permissions: ["org_admin"],
            message: "Login successful!",
          }),
        };
      } catch (error) {
        console.error("Organization admin login error:", error);
        return {
          statusCode: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: "Login error",
            message: error.message,
          }),
        };
      }
    }

    // Handle auth/me endpoint
    if (
      (event.path === "/auth/me" ||
        event.path === "/api/auth/me" ||
        event.path === "/.netlify/functions/api/auth/me") &&
      event.httpMethod === "GET"
    ) {
      // For demo mode, return demo user data
      if (!sql) {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            user: {
              id: 1,
              email: "admin@democompany.com",
              name: "Demo Admin",
              role: "org_admin",
              organization_name: "Demo Company",
              organization_slug: "demo-company",
            },
            organization: {
              id: 1,
              name: "Demo Company",
              slug: "demo-company",
            },
          }),
        };
      }

      // In a real implementation, you would validate session/token here
      // For now, return 401 if no demo mode
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Not authenticated",
        }),
      };
    }

    // Handle auth/logout endpoint
    if (
      (event.path === "/auth/logout" ||
        event.path === "/api/auth/logout" ||
        event.path === "/.netlify/functions/api/auth/logout") &&
      event.httpMethod === "POST"
    ) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          message: "Logged out successfully",
        }),
      };
    }

    // Handle organization creation
    if (
      (event.path === "/organizations/register" ||
        event.path === "/api/organizations/register" ||
        event.path === "/.netlify/functions/api/organizations/register") &&
      event.httpMethod === "POST"
    ) {
      try {
        const body = JSON.parse(event.body || "{}");
        console.log("Organization creation attempt:", {
          companyName: body.companyName,
        });

        // Create organization data and store it
        const organizationData = {
          id: organizations.length + 1,
          name: body.companyName,
          slug:
            body.slug || body.companyName.toLowerCase().replace(/\s+/g, "-"),
          address: body.address,
          gstNumber: body.gstNumber,
          phone: body.superAdminMobile,
          email: body.superAdminEmail,
          industry: body.industry,
          subscriptionPlan: "basic",
          subscriptionAmount: 999,
          subscriptionStartDate: body.subscriptionStartDate,
          subscriptionEndDate: body.subscriptionEndDate,
          maxUsers: 10,
          subscriptionStatus: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const adminData = {
          id: organizationAdmins.length + 1,
          organizationId: organizationData.id,
          username: body.superAdminEmail,
          fullName: body.superAdminName,
          email: body.superAdminEmail,
          phone: body.superAdminMobile,
          role: "org_admin",
          status: true,
          createdAt: new Date().toISOString(),
          // Generate a simple password hash for demo (in production, use proper hashing)
          password: "demo_password_hash",
        };

        // Store in memory
        organizations.push(organizationData);
        organizationAdmins.push(adminData);

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            message: "Organization created successfully!",
            organization: organizationData,
            admin: adminData,
            note: "This is a demo response. In production, this would create actual database records.",
          }),
        };
      } catch (error) {
        console.error("Organization creation error:", error);
        return {
          statusCode: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: "Failed to create organization",
            message: error.message,
          }),
        };
      }
    }

    // Handle organizations list
    if (
      (event.path === "/organizations" ||
        event.path === "/api/organizations" ||
        event.path === "/.netlify/functions/api/organizations") &&
      event.httpMethod === "GET"
    ) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          organizations: organizations,
          total: organizations.length,
          message:
            organizations.length === 0
              ? "No organizations found."
              : `Found ${organizations.length} organization(s).`,
        }),
      };
    }

    // Default response for unhandled routes
    console.log("=== UNHANDLED ROUTE ===");
    console.log("Path:", event.path);
    console.log("Method:", event.httpMethod);
    console.log("Body:", event.body);
    console.log("Headers:", event.headers);
    console.log("=== END UNHANDLED ROUTE ===");

    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Route not found",
        path: event.path,
        method: event.httpMethod,
        availableRoutes: [
          "POST /auth/org-admin/login",
          "POST /api/auth/org-admin/login",
          "POST /.netlify/functions/api/auth/org-admin/login",
        ],
      }),
    };
  } catch (error) {
    console.error("Function error:", error);
    console.error("Error stack:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: error.stack,
      }),
    };
  }
};
