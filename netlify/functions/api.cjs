const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
const { promisify } = require("util");

// Database connection
const databaseUrl =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required"
  );
}

const sql = neon(databaseUrl);
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
          console.log(
            "Environment variables:",
            Object.keys(process.env).filter((key) => key.includes("DATABASE"))
          );

          if (!databaseUrl) {
            throw new Error("Database URL not found in environment variables");
          }

          // For now, return a message asking to create the super admin manually
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              message:
                "Please create the super admin account manually in Neon console",
              instructions:
                "Run the SQL from setup-demo-accounts.sql in your Neon database",
              sql: `INSERT INTO super_admins (username, password, full_name, email, role, status, created_at, updated_at) VALUES ('superadmin', '4b6a04ce8f5b24cd26f1705598315fdaab27ea9116b2783e90bde23adfdd7ce38b63ee5c1aa846b9696fe19c1aeb16842105a34167283c32619386910f40ff23.7a876254766f3786dfdedf62a6414725', 'Super Administrator', 'admin@salesmanagement.com', 'super_admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (email) DO NOTHING;`,
              credentials: {
                email: "admin@salesmanagement.com",
                password: "SuperAdmin123!",
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

    // Handle organization admin login
    if (
      (event.path === "/auth/org-admin/login" ||
        event.path === "/api/auth/org-admin/login" ||
        event.path === "/.netlify/functions/api/auth/org-admin/login") &&
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
            admin: {
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
