import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db.js';
import { 
  organizations, 
  users, 
  roles, 
  departments,
  organizationInvitations 
} from '@shared/schema.js';
import { 
  organizationRegistrationSchema, 
  userInvitationSchema,
  insertOrganizationSchema,
  insertUserSchema,
  insertRoleSchema,
  insertDepartmentSchema
} from '@shared/schema.js';
import { 
  resolveTenant, 
  requireAuth, 
  requireOrgAdmin, 
  requireSuperAdmin,
  requirePermission 
} from '../middleware/tenant.js';
import { hashPassword, createAuditLog } from './auth.js';
import { TenantUtils, UserRole, Permission, DEFAULT_ROLE_PERMISSIONS } from '@shared/tenant-utils.js';

const router = Router();

/**
 * POST /organizations/register
 * Register a new organization (admin-managed onboarding)
 */
router.post('/register', requireSuperAdmin, async (req, res) => {
  try {
    const validation = organizationRegistrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      });
    }

    const {
      companyName,
      slug,
      address,
      gstNumber,
      superAdminEmail,
      superAdminMobile,
      superAdminName,
      superAdminPassword,
      industry,
      subscriptionStartDate,
      subscriptionEndDate
    } = validation.data;

    // Check if slug is available
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (existingOrg.length > 0) {
      return res.status(409).json({ 
        error: 'Organization slug already exists',
        message: 'Please choose a different slug'
      });
    }

    // Check if admin email is already used
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, superAdminEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }

    // Calculate subscription dates
    const startDate = subscriptionStartDate ? new Date(subscriptionStartDate) : new Date();
    const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from start

    // Create organization
    const [organization] = await db
      .insert(organizations)
      .values({
        name: companyName,
        slug,
        address,
        gstNumber,
        phone: superAdminMobile,
        email: superAdminEmail,
        industry,
        subscriptionPlan: 'paid',
        subscriptionAmount: '6000',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        maxUsers: -1, // Unlimited users
      })
      .returning();

    // Hash admin password
    const hashedPassword = await hashPassword(superAdminPassword);

    // Create organization admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        organizationId: organization.id,
        username: superAdminEmail,
        password: hashedPassword,
        fullName: superAdminName,
        email: superAdminEmail,
        phone: superAdminMobile,
        role: UserRole.ORG_ADMIN,
        permissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[UserRole.ORG_ADMIN]),
        status: true,
        emailVerified: true,
        joiningDate: new Date(),
      })
      .returning();

    // Create default roles for the organization
    const defaultRoles = [
      {
        organizationId: organization.id,
        name: 'Organization Admin',
        description: 'Full access to organization management',
        permissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[UserRole.ORG_ADMIN]),
        isDefault: true,
      },
      {
        organizationId: organization.id,
        name: 'Manager',
        description: 'Team management and sales oversight',
        permissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[UserRole.MANAGER]),
        isDefault: true,
      },
      {
        organizationId: organization.id,
        name: 'Sales Executive',
        description: 'Sales creation and management',
        permissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[UserRole.SALES_EXECUTIVE]),
        isDefault: true,
      },
      {
        organizationId: organization.id,
        name: 'User',
        description: 'Basic user access',
        permissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[UserRole.USER]),
        isDefault: true,
      },
    ];

    await db.insert(roles).values(defaultRoles);

    // Create default departments
    const defaultDepartments = [
      {
        organizationId: organization.id,
        name: 'Sales',
        description: 'Sales team',
      },
      {
        organizationId: organization.id,
        name: 'Management',
        description: 'Management team',
      },
      {
        organizationId: organization.id,
        name: 'Administration',
        description: 'Administrative team',
      },
    ];

    await db.insert(departments).values(defaultDepartments);

    await createAuditLog(
      organization.id, 
      adminUser.id, 
      'create', 
      'organization', 
      organization.id, 
      req
    );

    // Return success response
    res.status(201).json({
      message: 'Organization created successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      admin: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        email: adminUser.email,
      }
    });
  } catch (error) {
    console.error('Organization registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /organizations
 * Get all organizations (super admin only)
 */
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const orgs = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      organizations: orgs,
      pagination: {
        page,
        limit,
        hasMore: orgs.length === limit,
      }
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /organizations/:slug
 * Get organization details
 */
router.get('/:slug', resolveTenant, requireAuth, requirePermission(Permission.VIEW_ORGANIZATION), async (req, res) => {
  try {
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.tenant!.organizationId))
      .limit(1);

    if (!organization.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization: organization[0] });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /organizations/:slug
 * Update organization details
 */
router.put('/:slug', resolveTenant, requireAuth, requirePermission(Permission.MANAGE_ORGANIZATION), async (req, res) => {
  try {
    const validation = insertOrganizationSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const updateData = validation.data;
    
    // Don't allow slug changes through this endpoint
    delete updateData.slug;

    const [updatedOrg] = await db
      .update(organizations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, req.tenant!.organizationId))
      .returning();

    await createAuditLog(
      req.tenant!.organizationId, 
      req.tenant!.userId!, 
      'update', 
      'organization', 
      req.tenant!.organizationId, 
      req
    );

    res.json({ organization: updatedOrg });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /organizations/:slug/invite
 * Invite user to organization
 */
router.post('/:slug/invite', resolveTenant, requireAuth, requirePermission(Permission.INVITE_USERS), async (req, res) => {
  try {
    const validation = userInvitationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { email, role, fullName, department, designation } = validation.data;

    // Check if user already exists in organization
    const existingUser = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.organizationId, req.tenant!.organizationId)
      ))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'A user with this email already exists in your organization'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await db
      .select()
      .from(organizationInvitations)
      .where(and(
        eq(organizationInvitations.email, email),
        eq(organizationInvitations.organizationId, req.tenant!.organizationId),
        eq(organizationInvitations.status, 'pending')
      ))
      .limit(1);

    if (existingInvitation.length > 0) {
      return res.status(409).json({ 
        error: 'Invitation already sent',
        message: 'An invitation has already been sent to this email'
      });
    }

    // Create invitation
    const token = TenantUtils.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [invitation] = await db
      .insert(organizationInvitations)
      .values({
        organizationId: req.tenant!.organizationId,
        email,
        role,
        invitedBy: req.tenant!.userId!,
        token,
        expiresAt,
      })
      .returning();

    await createAuditLog(
      req.tenant!.organizationId, 
      req.tenant!.userId!, 
      'invite', 
      'user', 
      undefined, 
      req
    );

    // TODO: Send invitation email
    // await sendInvitationEmail(email, token, req.tenant!.organizationSlug);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
