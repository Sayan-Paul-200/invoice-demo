import { Request, Response } from 'express';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { schema } from '@invoice-management-system/db';
import { CreateInvoiceSchema, UpdateInvoiceSchema } from './dtos';

// Helper to enforce row-level security
async function getScopeCondition(req: Request): Promise<SQL | undefined> {
  const { dbClient } = req.globalContext;
  const { userId, role, projectId } = req.context;

  // 1. Staff: Own invoices only (+ Project scope if assigned)
  if (role === 'staff') {
    let condition = eq(schema.invoices.createdById, userId);
    if (projectId) {
      condition = and(condition, eq(schema.invoices.projectId, projectId))!;
    }
    return condition;
  }

  // 2. Accountant: Paid invoices only (+ Project scope if assigned)
  if (role === 'accountant') {
    // Fetch 'Paid' status ID using Core Query Builder
    const statusRow = await dbClient
      .select({ id: schema.invoiceStatuses.id })
      .from(schema.invoiceStatuses)
      .where(eq(schema.invoiceStatuses.name, 'Paid'))
      .limit(1);
    
    if (statusRow.length === 0) return undefined; // No 'Paid' status found

    let condition = eq(schema.invoices.statusId, statusRow[0].id);
    if (projectId) {
      condition = and(condition, eq(schema.invoices.projectId, projectId))!;
    }
    return condition;
  }

  // 3. Admin: All access
  return undefined;
}

export const listInvoices = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;

  try {
    const whereCondition = await getScopeCondition(req);

    // Edge Case: Accountant with no 'Paid' status in DB should see empty list, not all
    if (req.context.role === 'accountant' && !whereCondition) {
      res.json({ data: [] });
      return;
    }

    // Default select() fetches ALL columns
    const query = dbClient.select().from(schema.invoices);
    
    if (whereCondition) {
      query.where(whereCondition);
    }

    const results = await query.orderBy(desc(schema.invoices.createdAt));
    res.json({ data: results });
  } catch (error) {
    console.error('List Error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  try {
    const scope = await getScopeCondition(req);

    // Edge Case: Accountant with no 'Paid' status
    if (req.context.role === 'accountant' && !scope) {
      res.status(404).json({ error: 'Invoice not found or access denied' });
      return;
    }
    
    const result = await dbClient
      .select()
      .from(schema.invoices)
      .where(scope ? and(eq(schema.invoices.id, id), scope) : eq(schema.invoices.id, id))
      .limit(1);

    if (result.length === 0) {
      res.status(404).json({ error: 'Invoice not found or access denied' });
      return;
    }

    res.json(result[0]);

  } catch (error) {
    console.error('Get Error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { userId, projectId: userProjectId, role } = req.context;

  const validated = CreateInvoiceSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  const input = validated.data;

  // Enforce Project Logic
  if (userProjectId && input.projectId !== userProjectId) {
    res.status(403).json({ error: 'Cannot create invoice for a different project' });
    return;
  }

  try {
    // Determine Initial Status ID
    let statusId = input.statusId;
    if (!statusId) {
       const statusName = role === 'accountant' ? 'Paid' : 'Draft';
       
       const statusRow = await dbClient
         .select({ id: schema.invoiceStatuses.id })
         .from(schema.invoiceStatuses)
         .where(eq(schema.invoiceStatuses.name, statusName))
         .limit(1);

       if (statusRow.length > 0) {
         statusId = statusRow[0].id;
       } else {
         // Fallback
         const anyStatus = await dbClient.select({ id: schema.invoiceStatuses.id }).from(schema.invoiceStatuses).limit(1);
         if (anyStatus.length === 0) throw new Error('No Invoice Statuses configured in DB');
         statusId = anyStatus[0].id;
       }
    }

    const [newInvoice] = await dbClient.insert(schema.invoices).values({
      ...input,
      statusId: statusId!,
      createdById: userId,
      // Decimal Conversions
      basicAmount: input.basicAmount.toString(),
      gstAmount: input.gstAmount.toString(),
      totalAmount: input.totalAmount.toString(),
      passedAmountByClient: input.passedAmountByClient?.toString(),
      retention: input.retention?.toString(),
      gstWithheld: input.gstWithheld?.toString(),
      tds: input.tds?.toString(),
      gstTds: input.gstTds?.toString(),
      bocw: input.bocw?.toString(),
      lowDepthDeduction: input.lowDepthDeduction?.toString(),
      ld: input.ld?.toString(),
      slaPenalty: input.slaPenalty?.toString(),
      penalty: input.penalty?.toString(),
      otherDeduction: input.otherDeduction?.toString(),
      totalDeduction: input.totalDeduction?.toString(),
      netPayable: input.netPayable?.toString(),
      amountPaidByClient: input.amountPaidByClient?.toString(),
      balancePendingAmount: input.balancePendingAmount?.toString(),
    }).returning();

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  const validated = UpdateInvoiceSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  const input = validated.data;

  try {
    const scope = await getScopeCondition(req);

    // Accountant Edge Case
    if (req.context.role === 'accountant' && !scope) {
      res.status(404).json({ error: 'Invoice not found or access denied' });
      return;
    }

    // Check permissions via scoping
    const existing = await dbClient
      .select({ id: schema.invoices.id })
      .from(schema.invoices)
      .where(scope ? and(eq(schema.invoices.id, id), scope) : eq(schema.invoices.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Invoice not found or access denied' });
      return;
    }

    // Update ALL fields allowed
    const [updated] = await dbClient.update(schema.invoices).set({
      ...input,
      updatedAt: new Date(),
      // Explicitly map all decimals to strings if present
      basicAmount: input.basicAmount?.toString(),
      gstAmount: input.gstAmount?.toString(),
      totalAmount: input.totalAmount?.toString(),
      passedAmountByClient: input.passedAmountByClient?.toString(),
      retention: input.retention?.toString(),
      gstWithheld: input.gstWithheld?.toString(),
      tds: input.tds?.toString(),
      gstTds: input.gstTds?.toString(),
      bocw: input.bocw?.toString(),
      lowDepthDeduction: input.lowDepthDeduction?.toString(),
      ld: input.ld?.toString(),
      slaPenalty: input.slaPenalty?.toString(),
      penalty: input.penalty?.toString(),
      otherDeduction: input.otherDeduction?.toString(),
      totalDeduction: input.totalDeduction?.toString(),
      netPayable: input.netPayable?.toString(),
      amountPaidByClient: input.amountPaidByClient?.toString(),
      balancePendingAmount: input.balancePendingAmount?.toString(),
    })
    .where(eq(schema.invoices.id, id))
    .returning();

    res.json(updated);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  try {
    const scope = await getScopeCondition(req);
    
    // Accountant Edge Case
    if (req.context.role === 'accountant' && !scope) {
      res.status(404).json({ error: 'Invoice not found or access denied' });
      return;
    }

    const [deleted] = await dbClient.delete(schema.invoices)
      .where(scope ? and(eq(schema.invoices.id, id), scope) : eq(schema.invoices.id, id))
      .returning({ id: schema.invoices.id });

    if (!deleted) {
      res.status(404).json({ error: 'Invoice not found or access denied' });
      return;
    }

    res.json({ message: 'Invoice deleted successfully', id: deleted.id });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};