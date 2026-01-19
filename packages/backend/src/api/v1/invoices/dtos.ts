import { z } from 'zod';
import { uuidRegex } from '../../../utils/validators';

// Helpers
const decimal = z.number().min(0, "Must be non-negative");
const optionalDecimal = z.number().min(0).optional().nullable();
const uuidV7 = z.string().regex(uuidRegex.v7, "Invalid UUIDv7");
const optionalUuidV7 = uuidV7.optional().nullable();

export const CreateInvoiceSchema = z.object({
  // --- Foreign Keys ---
  projectId: uuidV7,
  billCategoryId: optionalUuidV7,
  milestoneId: optionalUuidV7,
  stateId: optionalUuidV7,
  statusId: uuidV7.optional(), // Optional on create (defaults to system default), required on update
  gstPercentageId: optionalUuidV7,

  // --- Core Data ---
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().date(), // YYYY-MM-DD
  submissionDate: z.string().date().optional().nullable(),

  // --- Financials ---
  basicAmount: decimal,
  gstAmount: decimal,
  totalAmount: decimal,

  // --- Deductions & Adjustments ---
  passedAmountByClient: optionalDecimal,
  retention: optionalDecimal,
  gstWithheld: optionalDecimal,
  tds: optionalDecimal,
  gstTds: optionalDecimal,
  bocw: optionalDecimal,
  lowDepthDeduction: optionalDecimal,
  ld: optionalDecimal,
  slaPenalty: optionalDecimal,
  penalty: optionalDecimal,
  otherDeduction: optionalDecimal,
  totalDeduction: optionalDecimal,
  netPayable: optionalDecimal,

  // --- Payments ---
  amountPaidByClient: optionalDecimal,
  paymentDate: z.string().date().optional().nullable(),
  balancePendingAmount: optionalDecimal,

  // --- Meta ---
  remarks: z.string().optional().nullable(),
  invoiceCopyUrl: z.string().url(),
  proofOfSubmissionUrl: z.string().url(),
  supportingDocuments: z.array(z.any()).optional().default([]),
});

// For updates: Allow updating ALL fields except createdById/createdAt
// We extend CreateInvoiceSchema.partial() to make everything optional
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  // Add explicit reasoning for status changes if needed, though strictly not in DB columns
  reason: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;