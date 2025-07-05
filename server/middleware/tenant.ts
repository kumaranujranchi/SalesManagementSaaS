import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db.js';
import { organizations, users } from '@shared/schema.js';
import { TenantContext, TenantUtils, UserRole, Permission } from '@shared/tenant-utils.js';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: any;
    }
  }
}

/**
 * Middleware to resolve tenant from subdomain or slug
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    let organizationSlug: string | undefined;

    // Try to get organization from subdomain
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        organizationSlug = subdomain;
      }
    }

    // Try to get organization from URL path (e.g., /org/slug/...)
    const pathMatch = req.path.match(/^\/org\/([^\/]+)/);
    if (pathMatch) {
      organizationSlug = pathMatch[1];
    }

    // Try to get organization from query parameter
    if (!organizationSlug && req.query.org) {
      organizationSlug = req.query.org as string;
    }

    // Try to get organization from request body (for login)
    if (!organizationSlug && req.body?.organizationSlug) {
      organizationSlug = req.body.organizationSlug;
    }

    if (!organizationSlug) {
      return res.status(400).json({ 
        error: 'Organization not specified',
        message: 'Please specify organization via subdomain, URL path, or query parameter'
      });
    }

    // Find organization by slug
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, organizationSlug))
      .limit(1);

    if (!organization.length) {
      return res.status(404).json({ 
        error: 'Organization not found',
        message: `Organization '${organizationSlug}' does not exist`
      });
    }

    const org = organization[0];

    // Check if organization is active
    if (org.subscriptionStatus !== 'active') {
      return res.status(403).json({ 
        error: 'Organization suspended',
        message: 'This organization account has been suspended'
      });
    }

    // Set tenant context
    req.tenant = {
      organizationId: org.id,
      organizationSlug: org.slug,
    };

    next();
  } catch (error) {
    console.error('Error resolving tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to require authentication and set user context
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify user belongs to the organization
    const user = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, req.user.id),
        eq(users.organizationId, req.tenant.organizationId)
      ))
      .limit(1);

    if (!user.length) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'User does not belong to this organization'
      });
    }

    const userData = user[0];

    // Check if user is active
    if (!userData.status) {
      return res.status(403).json({ 
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }

    // Parse permissions
    let permissions: Permission[] = [];
    try {
      const userPermissions = JSON.parse(userData.permissions || '[]');
      permissions = Array.isArray(userPermissions) ? userPermissions : [];
    } catch (e) {
      // If permissions are not valid JSON, get default permissions for role
      permissions = TenantUtils.getPermissionsForRole(userData.role as UserRole);
    }

    // Update tenant context with user info
    req.tenant = {
      ...req.tenant,
      userId: userData.id,
      userRole: userData.role,
      permissions,
    };

    // Update user object with full data
    req.user = userData;

    next();
  } catch (error) {
    console.error('Error in requireAuth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    if (!TenantUtils.hasPermission(req.tenant, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires '${permission}' permission`
      });
    }

    next();
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    if (!TenantUtils.hasAnyPermission(req.tenant, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of: ${permissions.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant || req.tenant.userRole !== role) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires '${role}' role`
      });
    }

    next();
  };
}

/**
 * Middleware to require organization admin or higher
 */
export function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  const adminRoles = [UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN];
  if (!adminRoles.includes(req.tenant.userRole as UserRole)) {
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'This action requires organization admin privileges'
    });
  }

  next();
}

/**
 * Middleware for super admin only routes
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'This action requires super admin privileges'
    });
  }

  next();
}

/**
 * Utility function to check if user can access resource
 */
export function canAccessResource(
  req: Request, 
  resourceUserId: number, 
  requiredPermissions: Permission[]
): boolean {
  if (!req.tenant) return false;

  // Super admin and org admin can access everything
  if ([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN].includes(req.tenant.userRole as UserRole)) {
    return true;
  }

  // Check if user has required permissions
  if (TenantUtils.hasAnyPermission(req.tenant, requiredPermissions)) {
    return true;
  }

  // Check if user is accessing their own resource
  return req.tenant.userId === resourceUserId;
}
