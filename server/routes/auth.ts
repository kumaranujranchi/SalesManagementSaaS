import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { promisify } from 'util';
import { db } from '../db.js';
import { users, organizations, superAdmins, auditLogs } from '@shared/schema.js';
import { loginSchema, superAdminLoginSchema } from '@shared/schema.js';
import { resolveTenant, requireAuth, requireSuperAdmin } from '../middleware/tenant.js';
import { TenantUtils, UserRole } from '@shared/tenant-utils.js';

const router = Router();
const scryptAsync = promisify(crypto.scrypt);

// Hash password utility
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Verify password utility
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [hashedPassword, salt] = hash.split('.');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return buf.toString('hex') === hashedPassword;
}

// Audit log utility
async function createAuditLog(
  organizationId: number | null,
  userId: number | null,
  action: string,
  resource: string,
  resourceId?: number,
  req?: any
) {
  try {
    await db.insert(auditLogs).values({
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * POST /auth/login
 * Organization user login
 */
router.post('/login', resolveTenant, async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;
    const organizationId = req.tenant!.organizationId;

    // Find user in the organization
    const user = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.organizationId, organizationId)
      ))
      .limit(1);

    if (!user.length) {
      await createAuditLog(organizationId, null, 'login_failed', 'user', undefined, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = user[0];

    // Check if user is active
    if (!userData.status) {
      await createAuditLog(organizationId, userData.id, 'login_failed', 'user', userData.id, req);
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userData.password);
    if (!isValidPassword) {
      await createAuditLog(organizationId, userData.id, 'login_failed', 'user', userData.id, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userData.id));

    // Get user permissions
    let permissions = [];
    try {
      permissions = JSON.parse(userData.permissions || '[]');
    } catch (e) {
      permissions = TenantUtils.getPermissionsForRole(userData.role as UserRole);
    }

    // Create session (assuming you're using express-session)
    req.session.userId = userData.id;
    req.session.organizationId = organizationId;

    await createAuditLog(organizationId, userData.id, 'login', 'user', userData.id, req);

    // Return user data (excluding password)
    const { password: _, ...userResponse } = userData;
    res.json({
      user: userResponse,
      permissions,
      organization: {
        id: req.tenant!.organizationId,
        slug: req.tenant!.organizationSlug,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/super-admin/login
 * Super admin login (platform level)
 */
router.post('/super-admin/login', async (req, res) => {
  try {
    const validation = superAdminLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;

    // Find super admin
    const admin = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, email))
      .limit(1);

    if (!admin.length) {
      await createAuditLog(null, null, 'super_admin_login_failed', 'super_admin', undefined, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const adminData = admin[0];

    // Check if admin is active
    if (!adminData.status) {
      await createAuditLog(null, adminData.id, 'super_admin_login_failed', 'super_admin', adminData.id, req);
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, adminData.password);
    if (!isValidPassword) {
      await createAuditLog(null, adminData.id, 'super_admin_login_failed', 'super_admin', adminData.id, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db
      .update(superAdmins)
      .set({ lastLogin: new Date() })
      .where(eq(superAdmins.id, adminData.id));

    // Create session
    req.session.superAdminId = adminData.id;
    req.session.isSuperAdmin = true;

    await createAuditLog(null, adminData.id, 'super_admin_login', 'super_admin', adminData.id, req);

    // Return admin data (excluding password)
    const { password: _, ...adminResponse } = adminData;
    res.json({
      admin: adminResponse,
      permissions: Object.values(TenantUtils.getPermissionsForRole(UserRole.SUPER_ADMIN)),
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/logout
 * Logout current user
 */
router.post('/logout', async (req, res) => {
  try {
    const userId = req.session.userId;
    const organizationId = req.session.organizationId;
    const superAdminId = req.session.superAdminId;

    if (userId && organizationId) {
      await createAuditLog(organizationId, userId, 'logout', 'user', userId, req);
    } else if (superAdminId) {
      await createAuditLog(null, superAdminId, 'super_admin_logout', 'super_admin', superAdminId, req);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', resolveTenant, requireAuth, async (req, res) => {
  try {
    const { password: _, ...userResponse } = req.user;
    
    res.json({
      user: userResponse,
      permissions: req.tenant!.permissions,
      organization: {
        id: req.tenant!.organizationId,
        slug: req.tenant!.organizationSlug,
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /auth/super-admin/me
 * Get current super admin info
 */
router.get('/super-admin/me', requireSuperAdmin, async (req, res) => {
  try {
    const admin = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, req.session.superAdminId))
      .limit(1);

    if (!admin.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const { password: _, ...adminResponse } = admin[0];
    
    res.json({
      admin: adminResponse,
      permissions: Object.values(TenantUtils.getPermissionsForRole(UserRole.SUPER_ADMIN)),
    });
  } catch (error) {
    console.error('Get super admin info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
export { hashPassword, verifyPassword, createAuditLog };
