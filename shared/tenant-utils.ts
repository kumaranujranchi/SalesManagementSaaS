import { z } from "zod";

// Tenant context interface
export interface TenantContext {
  organizationId: number;
  organizationSlug: string;
  userId?: number;
  userRole?: string;
  permissions?: string[];
}

// Role definitions for multi-tenant system
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ORG_ADMIN = "org_admin",
  MANAGER = "manager",
  SALES_EXECUTIVE = "sales_executive",
  USER = "user",
  VIEWER = "viewer"
}

// Permission definitions
export enum Permission {
  // Organization management
  MANAGE_ORGANIZATION = "manage_organization",
  VIEW_ORGANIZATION = "view_organization",
  
  // User management
  MANAGE_USERS = "manage_users",
  INVITE_USERS = "invite_users",
  VIEW_USERS = "view_users",
  
  // Project management
  MANAGE_PROJECTS = "manage_projects",
  CREATE_PROJECTS = "create_projects",
  VIEW_PROJECTS = "view_projects",
  
  // Sales management
  MANAGE_ALL_SALES = "manage_all_sales",
  MANAGE_OWN_SALES = "manage_own_sales",
  CREATE_SALES = "create_sales",
  VIEW_ALL_SALES = "view_all_sales",
  VIEW_OWN_SALES = "view_own_sales",
  
  // Payment management
  MANAGE_PAYMENTS = "manage_payments",
  VIEW_PAYMENTS = "view_payments",
  
  // Target management
  MANAGE_TARGETS = "manage_targets",
  VIEW_TARGETS = "view_targets",
  
  // Reports and analytics
  VIEW_REPORTS = "view_reports",
  VIEW_ANALYTICS = "view_analytics",
  
  // Site visits
  MANAGE_SITE_VISITS = "manage_site_visits",
  APPROVE_SITE_VISITS = "approve_site_visits",
  CREATE_SITE_VISITS = "create_site_visits",
  VIEW_SITE_VISITS = "view_site_visits",
  
  // Announcements
  MANAGE_ANNOUNCEMENTS = "manage_announcements",
  VIEW_ANNOUNCEMENTS = "view_announcements",
}

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // All permissions
  
  [UserRole.ORG_ADMIN]: [
    Permission.MANAGE_ORGANIZATION,
    Permission.VIEW_ORGANIZATION,
    Permission.MANAGE_USERS,
    Permission.INVITE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_PROJECTS,
    Permission.CREATE_PROJECTS,
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_ALL_SALES,
    Permission.CREATE_SALES,
    Permission.VIEW_ALL_SALES,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.MANAGE_TARGETS,
    Permission.VIEW_TARGETS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SITE_VISITS,
    Permission.APPROVE_SITE_VISITS,
    Permission.CREATE_SITE_VISITS,
    Permission.VIEW_SITE_VISITS,
    Permission.MANAGE_ANNOUNCEMENTS,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  
  [UserRole.MANAGER]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_USERS,
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_ALL_SALES,
    Permission.CREATE_SALES,
    Permission.VIEW_ALL_SALES,
    Permission.VIEW_PAYMENTS,
    Permission.MANAGE_TARGETS,
    Permission.VIEW_TARGETS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.APPROVE_SITE_VISITS,
    Permission.CREATE_SITE_VISITS,
    Permission.VIEW_SITE_VISITS,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  
  [UserRole.SALES_EXECUTIVE]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_OWN_SALES,
    Permission.CREATE_SALES,
    Permission.VIEW_OWN_SALES,
    Permission.VIEW_TARGETS,
    Permission.CREATE_SITE_VISITS,
    Permission.VIEW_SITE_VISITS,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  
  [UserRole.USER]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_PROJECTS,
    Permission.VIEW_OWN_SALES,
    Permission.VIEW_TARGETS,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
  
  [UserRole.VIEWER]: [
    Permission.VIEW_ORGANIZATION,
    Permission.VIEW_ANNOUNCEMENTS,
  ],
};

// Utility functions for tenant operations
export class TenantUtils {
  /**
   * Check if user has specific permission
   */
  static hasPermission(context: TenantContext, permission: Permission): boolean {
    if (!context.permissions) return false;
    return context.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(context: TenantContext, permissions: Permission[]): boolean {
    if (!context.permissions) return false;
    return permissions.some(permission => context.permissions!.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(context: TenantContext, permissions: Permission[]): boolean {
    if (!context.permissions) return false;
    return permissions.every(permission => context.permissions!.includes(permission));
  }

  /**
   * Get permissions for a role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Generate organization slug from name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 50); // Limit length
  }

  /**
   * Validate organization slug
   */
  static isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50;
  }

  /**
   * Generate invitation token
   */
  static generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Calculate trial end date (30 days from now)
   */
  static calculateTrialEndDate(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 30);
    return now;
  }

  /**
   * Check if organization is within user limits
   */
  static isWithinUserLimit(currentUserCount: number, maxUsers: number): boolean {
    return currentUserCount < maxUsers;
  }

  /**
   * Get subscription features based on plan
   */
  static getSubscriptionFeatures(plan: string): {
    maxUsers: number;
    maxProjects: number;
    hasAdvancedReports: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
  } {
    switch (plan) {
      case 'trial':
        return {
          maxUsers: 5,
          maxProjects: 3,
          hasAdvancedReports: false,
          hasApiAccess: false,
          hasCustomBranding: false,
        };
      case 'basic':
        return {
          maxUsers: 10,
          maxProjects: 10,
          hasAdvancedReports: false,
          hasApiAccess: false,
          hasCustomBranding: false,
        };
      case 'premium':
        return {
          maxUsers: 50,
          maxProjects: 50,
          hasAdvancedReports: true,
          hasApiAccess: true,
          hasCustomBranding: false,
        };
      case 'enterprise':
        return {
          maxUsers: -1, // Unlimited
          maxProjects: -1, // Unlimited
          hasAdvancedReports: true,
          hasApiAccess: true,
          hasCustomBranding: true,
        };
      default:
        return {
          maxUsers: 5,
          maxProjects: 3,
          hasAdvancedReports: false,
          hasApiAccess: false,
          hasCustomBranding: false,
        };
    }
  }
}

// Middleware helper for tenant context
export interface TenantRequest extends Request {
  tenant?: TenantContext;
}

// Database query helper for tenant isolation
export class TenantQueryBuilder {
  /**
   * Add organization filter to query conditions
   */
  static addOrgFilter(conditions: any, organizationId: number): any {
    return {
      ...conditions,
      organizationId,
    };
  }

  /**
   * Add user-specific filter for own data access
   */
  static addUserFilter(conditions: any, userId: number, field: string = 'userId'): any {
    return {
      ...conditions,
      [field]: userId,
    };
  }
}
