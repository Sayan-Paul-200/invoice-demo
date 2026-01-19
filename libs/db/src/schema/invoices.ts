import { sql, relations } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, date, decimal, text, jsonb, check } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { states } from "./locations";
import { users } from "./users";

// --- Lookups & Master Data ---

export const billCategories = pgTable("bill_category", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const milestones = pgTable("milestone", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const gstPercentages = pgTable("gst_percentage_applicable", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  label: varchar("label"),
  value: decimal("value", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const invoiceStatuses = pgTable("status", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Main Entity: Invoice ---

export const invoices = pgTable("invoice", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),

  // Invoice relation to user
  createdById: uuid("created_by")
    .notNull()
    .references(() => users.id),

  // Foreign Keys (All NOT NULL as per requirement 2.1)
  projectId: uuid("project").notNull().references(() => projects.id),
  billCategoryId: uuid("bill_category").references(() => billCategories.id),
  milestoneId: uuid("milestone").references(() => milestones.id),
  stateId: uuid("state").references(() => states.id),
  statusId: uuid("status").notNull().references(() => invoiceStatuses.id),
  gstPercentageId: uuid("gst_percentage_id").references(() => gstPercentages.id),
  // Core Data
  invoiceNumber: varchar("invoice_number").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  submissionDate: date("submission_date"),

  // Financials
  basicAmount: decimal("basic_amount", { precision: 15, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  
  // Deductions & Adjustments
  passedAmountByClient: decimal("passed_amount_by_client", { precision: 15, scale: 2 }),
  retention: decimal("retention", { precision: 15, scale: 2 }),
  gstWithheld: decimal("gst_withheld", { precision: 15, scale: 2 }),
  tds: decimal("tds", { precision: 15, scale: 2 }),
  gstTds: decimal("gst_tds", { precision: 15, scale: 2 }),
  bocw: decimal("bocw", { precision: 15, scale: 2 }),
  lowDepthDeduction: decimal("low_depth_deduction", { precision: 15, scale: 2 }),
  ld: decimal("ld", { precision: 15, scale: 2 }),
  slaPenalty: decimal("sla_penalty", { precision: 15, scale: 2 }),
  penalty: decimal("penalty", { precision: 15, scale: 2 }),
  otherDeduction: decimal("other_deduction", { precision: 15, scale: 2 }),
  totalDeduction: decimal("total_deduction", { precision: 15, scale: 2 }),
  netPayable: decimal("net_payable", { precision: 15, scale: 2 }),

  // Payments
  amountPaidByClient: decimal("amount_paid_by_client", { precision: 15, scale: 2 }),
  paymentDate: date("payment_date"),
  balancePendingAmount: decimal("balance_pending_amount", { precision: 15, scale: 2 }),

  remarks: text("remarks"),

  // Files
  invoiceCopyUrl: varchar("invoice_copy", { length: 1024 }).notNull(),
  proofOfSubmissionUrl: varchar("proof_of_submission", { length: 1024 }).notNull(),
  supportingDocuments: jsonb("supporting_documents").notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  // --- Check Constraints (Requirement 2.2) ---
  chkBasicAmount: check("chk_invoice_basic_amount_nonneg", sql`${t.basicAmount} >= 0`),
  chkGstAmount: check("chk_invoice_gst_amount_nonneg", sql`${t.gstAmount} >= 0`),
  chkTotalAmount: check("chk_invoice_total_amount_nonneg", sql`${t.totalAmount} >= 0`),
  chkPassedAmount: check("chk_invoice_passed_amount_nonneg", sql`${t.passedAmountByClient} IS NULL OR ${t.passedAmountByClient} >= 0`),
  chkRetention: check("chk_invoice_retention_nonneg", sql`${t.retention} IS NULL OR ${t.retention} >= 0`),
  chkGstWithheld: check("chk_invoice_gst_withheld_nonneg", sql`${t.gstWithheld} IS NULL OR ${t.gstWithheld} >= 0`),
  chkTds: check("chk_invoice_tds_nonneg", sql`${t.tds} IS NULL OR ${t.tds} >= 0`),
  chkGstTds: check("chk_invoice_gst_tds_nonneg", sql`${t.gstTds} IS NULL OR ${t.gstTds} >= 0`),
  chkBocw: check("chk_invoice_bocw_nonneg", sql`${t.bocw} IS NULL OR ${t.bocw} >= 0`),
  chkLowDepth: check("chk_invoice_low_depth_nonneg", sql`${t.lowDepthDeduction} IS NULL OR ${t.lowDepthDeduction} >= 0`),
  chkLd: check("chk_invoice_ld_nonneg", sql`${t.ld} IS NULL OR ${t.ld} >= 0`),
  chkSlaPenalty: check("chk_invoice_sla_penalty_nonneg", sql`${t.slaPenalty} IS NULL OR ${t.slaPenalty} >= 0`),
  chkPenalty: check("chk_invoice_penalty_nonneg", sql`${t.penalty} IS NULL OR ${t.penalty} >= 0`),
  chkOtherDed: check("chk_invoice_other_deduction_nonneg", sql`${t.otherDeduction} IS NULL OR ${t.otherDeduction} >= 0`),
  chkTotalDed: check("chk_invoice_total_deduction_nonneg", sql`${t.totalDeduction} IS NULL OR ${t.totalDeduction} >= 0`),
  chkNetPayable: check("chk_invoice_net_payable_nonneg", sql`${t.netPayable} IS NULL OR ${t.netPayable} >= 0`),
  chkAmountPaid: check("chk_invoice_amount_paid_nonneg", sql`${t.amountPaidByClient} IS NULL OR ${t.amountPaidByClient} >= 0`),
  chkBalPending: check("chk_invoice_balance_pending_nonneg", sql`${t.balancePendingAmount} IS NULL OR ${t.balancePendingAmount} >= 0`),
}));

// --- Invoice Status History (Requirement 2.3) ---

export const invoiceStatusHistory = pgTable("invoice_status_history", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
    
  fromStatusId: uuid("from_status")
    .references(() => invoiceStatuses.id), // Nullable for initial creation
    
  toStatusId: uuid("to_status")
    .notNull()
    .references(() => invoiceStatuses.id),
    
  changedBy: uuid("changed_by"), // Reference to Users table if available, else plain UUID
  
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  reason: text("reason"),
});

// --- Relations ---

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  billCategory: one(billCategories, {
    fields: [invoices.billCategoryId],
    references: [billCategories.id],
  }),
  milestone: one(milestones, {
    fields: [invoices.milestoneId],
    references: [milestones.id],
  }),
  state: one(states, {
    fields: [invoices.stateId],
    references: [states.id],
  }),
  status: one(invoiceStatuses, {
    fields: [invoices.statusId],
    references: [invoiceStatuses.id],
  }),
  gstPercentage: one(gstPercentages, {
    fields: [invoices.gstPercentageId],
    references: [gstPercentages.id],
  }),
  statusHistory: many(invoiceStatusHistory),
  createdBy: one(users, {
    fields: [invoices.createdById],
    references: [users.id],
  }),
}));

export const invoiceStatusHistoryRelations = relations(invoiceStatusHistory, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceStatusHistory.invoiceId],
    references: [invoices.id],
  }),
  fromStatus: one(invoiceStatuses, {
    fields: [invoiceStatusHistory.fromStatusId],
    references: [invoiceStatuses.id],
  }),
  toStatus: one(invoiceStatuses, {
    fields: [invoiceStatusHistory.toStatusId],
    references: [invoiceStatuses.id],
  }),
}));