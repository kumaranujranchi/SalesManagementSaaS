import { pgTable, text, serial, integer, boolean, timestamp, numeric, date, doublePrecision, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sales Designations Enum for hierarchy
export enum SalesDesignation {
  SALES_EXECUTIVE = "Sales Executive",
  TEAM_LEADER = "Team Leader",
  SALES_HEAD = "Sales Head"
}

// Organization/Tenant table for multi-tenancy
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Company Name
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  domain: text("domain"), // Custom domain (optional)
  logo: text("logo"), // Organization logo URL
  address: text("address").notNull(), // Company Address
  gstNumber: text("gst_number"), // GST Number (if available)
  phone: text("phone").notNull(), // Super Admin Mobile Number
  email: text("email").notNull(), // Super Admin Email
  website: text("website"),
  industry: text("industry"), // Real Estate, Manufacturing, etc.
  subscriptionPlan: text("subscription_plan").default("paid"), // paid (₹6000 annually)
  subscriptionStatus: text("subscription_status").default("active"), // active, suspended, cancelled
  subscriptionAmount: numeric("subscription_amount").default("6000"), // Annual subscription amount
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  maxUsers: integer("max_users").default(-1), // Unlimited users for paid plan
  settings: text("settings").default("{}"), // JSON settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Super admin users (platform administrators)
export const superAdmins = pgTable("super_admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").default("super_admin"), // super_admin, platform_admin
  status: boolean("status").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  username: text("username").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  designation: text("designation"),
  department: text("department"),
  reportingManager: text("reporting_manager"),  // Keep original for backward compatibility
  reportingManagerId: integer("reporting_manager_id"),  // New integer field for user IDs
  team: text("team"),  // Added for Sales Department team identification
  imageUrl: text("image_url"),  // Added for user profile image
  role: text("role").default("user"), // org_admin, manager, sales_executive, user
  permissions: text("permissions").default("{}"), // JSON permissions object
  status: boolean("status").default(true),
  employeeId: text("employee_id"), // Unique within organization
  joiningDate: timestamp("joining_date", { mode: 'date' }),  // Date of joining for target calculation
  monthlyTarget: doublePrecision("monthly_target"),   // Monthly target in square feet
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  lastLogin: timestamp("last_login"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  projectType: text("project_type").notNull(), // Options: "Land", "Apartment", "Duplex"
  imageUrl: text("image_url"), // Project image link
  location: text("location").notNull(), // Full address
  deadline: timestamp("deadline"),
  status: text("status").default("running"), // Options: "running", "closed", "on_hold"
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").default("{}"),
  isDefault: boolean("is_default").default(false), // Default roles created for new organizations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievement: text("achievement").notNull(),
  score: integer("score").default(0),
  period: text("period"), // monthly, quarterly, yearly
  year: integer("year"),
  month: integer("month"),
  quarter: integer("quarter"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isImportant: boolean("is_important").default(false),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  salesExecutiveId: integer("sales_executive_id").notNull().references(() => users.id), // User ID of the sales executive
  projectId: integer("project_id").notNull().references(() => projects.id), // Project being sold
  bookingDate: date("booking_date").notNull(), // Date of the sale
  bookingDone: text("booking_done").default("No"), // Whether agreement is done or not (Yes/No)
  bookingData: text("booking_data"), // Additional booking data if agreement is not done
  agreementDate: date("agreement_date"), // Date when agreement was completed
  customerName: text("customer_name"), // Customer name
  customerMobile: text("customer_mobile"), // Customer mobile number
  areaSold: numeric("area_sold").notNull(), // Area sold in square feet
  baseSalePrice: numeric("base_sale_price"), // Base sale price per square foot
  finalAmount: numeric("final_amount"), // Final sale amount (BSP * areaSold)
  amountPaid: numeric("amount_paid").default("0"), // Total amount paid so far
  paymentPercentage: numeric("payment_percentage").default("0"), // Percentage of payment completed
  developmentCharges: numeric("development_charges").default("0"), // DC - Development Charges
  preferredLocationCharge: numeric("preferred_location_charge").default("0"), // PLC - Preferred Location Charge
  plotNo: text("plot_no"), // Plot number
  status: text("status").default("active"), // active, cancelled
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancellationReason: text("cancellation_reason"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: 'cascade' }),
  paymentDate: date("payment_date").notNull(),
  amount: numeric("amount").notNull(),
  paymentMode: text("payment_mode").notNull(), // Cash, Cheque, Account Transfer, UPI, DD
  paymentType: text("payment_type").notNull(), // EMI, Advance, Booking, Token, Loan Disbursement
  remarks: text("remarks"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const targets = pgTable("targets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  targetValue: doublePrecision("target_value").notNull(), // Monthly target value in sq ft
  achieved: doublePrecision("achieved").default(0),       // Actual achievement in sq ft
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Incentive system tables
export const incentives = pgTable("incentives", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: 'cascade' }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  areaSold: doublePrecision("area_sold").notNull(),
  totalRevenue: doublePrecision("total_revenue").notNull(),
  slabNumber: integer("slab_number").notNull(),
  incentiveRate: doublePrecision("incentive_rate").notNull(), // Percentage rate
  grossIncentive: doublePrecision("gross_incentive").notNull(),
  paymentPercentage: doublePrecision("payment_percentage").notNull().default(0),
  eligibleIncentive: doublePrecision("eligible_incentive").notNull().default(0),
  quarter: integer("quarter").notNull(),
  payoutMonth: integer("payout_month").notNull(),
  payoutYear: integer("payout_year").notNull(),
  milestoneReached: integer("milestone_reached").default(0), // 0, 30, 50, 75, 100
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const incentivePayouts = pgTable("incentive_payouts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  quarter: integer("quarter").notNull(),
  year: integer("year").notNull(),
  totalIncentive: doublePrecision("total_incentive").notNull(),
  payoutDate: timestamp("payout_date"),
  status: text("status").notNull().default("pending"), // pending, paid
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Site Visit Management table
export const siteVisits = pgTable("site_visits", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  salesExecutiveId: integer("sales_executive_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerName: text("customer_name").notNull(),
  visitDate: date("visit_date").notNull(),
  visitTime: text("visit_time").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  projectIds: text("project_ids").notNull(), // JSON array of project IDs as string
  notes: text("notes"), // Additional notes from the requester
  status: text("status").default("pending"), // pending, approved, declined, completed, cancelled
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  assignedDriverId: integer("assigned_driver_id").references(() => users.id),
  startOdometer: numeric("start_odometer"),
  endOdometer: numeric("end_odometer"),
  completedAt: timestamp("completed_at"),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancelledAt: timestamp("cancelled_at"),
  remarks: text("remarks"), // Admin/driver remarks during processing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization invitations for user onboarding
export const organizationInvitations = pgTable("organization_invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  status: text("status").default("pending"), // pending, accepted, expired, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log for tracking changes across organizations
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // create, update, delete, login, logout
  resource: text("resource").notNull(), // user, project, sale, etc.
  resourceId: integer("resource_id"),
  oldValues: text("old_values"), // JSON
  newValues: text("new_values"), // JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organization schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSuperAdminSchema = createInsertSchema(superAdmins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  emailVerificationToken: true,
  passwordResetToken: true,
  passwordResetExpires: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Custom schema for sales entry
export const insertSalesSchema = z.object({
  organizationId: z.number(),
  salesExecutiveId: z.number(),
  projectId: z.number(),
  bookingDate: z.string(),
  bookingDone: z.string().default("No"),
  bookingData: z.string().optional(),
  customerName: z.string().optional(),
  customerMobile: z.string().optional(),
  areaSold: z.string().or(z.number()).transform(val => String(val)),
  baseSalePrice: z.string().or(z.number()).transform(val => String(val)).optional(),
  finalAmount: z.string().or(z.number()).transform(val => String(val)).optional(),
  amountPaid: z.string().or(z.number()).transform(val => String(val)).optional(),
  paymentPercentage: z.string().or(z.number()).transform(val => String(val)).optional(),
  developmentCharges: z.string().or(z.number()).transform(val => String(val)).optional(),
  preferredLocationCharge: z.string().or(z.number()).transform(val => String(val)).optional(),
  plotNo: z.string().optional(),
  createdBy: z.number()
});

// Schema for payment entries
export const insertPaymentSchema = z.object({
  organizationId: z.number(),
  saleId: z.number(),
  paymentDate: z.string(),
  amount: z.string().or(z.number()).transform(val => String(val)),
  paymentMode: z.string(),
  paymentType: z.string(),
  remarks: z.string().optional(),
  createdBy: z.number()
});

// Schema for target entries
export const insertTargetSchema = createInsertSchema(targets).omit({
  id: true,
  lastUpdated: true,
});

// Schema for incentive entries
export const insertIncentiveSchema = createInsertSchema(incentives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncentivePayoutSchema = createInsertSchema(incentivePayouts).omit({
  id: true,
  createdAt: true,
});

// Schema for site visit entries
export const insertSiteVisitSchema = createInsertSchema(siteVisits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for organization invitations
export const insertOrganizationInvitationSchema = createInsertSchema(organizationInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

// Schema for audit logs
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Organization registration schema (Admin-managed onboarding)
export const organizationRegistrationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  address: z.string().min(10, "Please provide complete address"),
  gstNumber: z.string().optional(), // GST Number if available
  superAdminEmail: z.string().email("Invalid email format"),
  superAdminMobile: z.string().min(10, "Please provide valid mobile number"),
  superAdminName: z.string().min(2, "Super admin name must be at least 2 characters"),
  superAdminPassword: z.string().min(6, "Password must be at least 6 characters"),
  industry: z.string().optional(),
  subscriptionStartDate: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
});

// User invitation schema
export const userInvitationSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.string().default("user"),
  fullName: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  organizationSlug: z.string().optional(), // For tenant-specific login
});

export const superAdminLoginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Type exports for insert schemas
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertSales = z.infer<typeof insertSalesSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type InsertIncentive = z.infer<typeof insertIncentiveSchema>;
export type InsertIncentivePayout = z.infer<typeof insertIncentivePayoutSchema>;
export type InsertSiteVisit = z.infer<typeof insertSiteVisitSchema>;
export type InsertOrganizationInvitation = z.infer<typeof insertOrganizationInvitationSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type OrganizationRegistration = z.infer<typeof organizationRegistrationSchema>;
export type UserInvitation = z.infer<typeof userInvitationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SuperAdminLoginData = z.infer<typeof superAdminLoginSchema>;

// Type exports for select schemas
export type Organization = typeof organizations.$inferSelect;
export type SuperAdmin = typeof superAdmins.$inferSelect;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Leaderboard = typeof leaderboard.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Sales = typeof sales.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Target = typeof targets.$inferSelect;
export type Incentive = typeof incentives.$inferSelect;
export type IncentivePayout = typeof incentivePayouts.$inferSelect;
export type SiteVisit = typeof siteVisits.$inferSelect;
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
