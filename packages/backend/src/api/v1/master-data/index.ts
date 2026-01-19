import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { schema } from '@invoice-management-system/db';

const router = Router();

// --- Generic CRUD Handler Generator ---
const createCrudHandlers = (table: any, orderByField: any) => {
  return {
    // 1. LIST (GET)
    list: async (req: any, res: any) => {
      const { dbClient } = req.globalContext;
      try {
        const results = await dbClient
          .select()
          .from(table)
          .orderBy(desc(orderByField));
        res.json({ data: results });
      } catch (error) {
        console.error('Master Data List Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
      }
    },

    // 2. CREATE (POST)
    create: async (req: any, res: any) => {
      const { dbClient } = req.globalContext;
      try {
        const result = await dbClient
          .insert(table)
          .values(req.body)
          .returning();
        res.json(result[0]);
      } catch (error) {
        console.error('Master Data Create Error:', error);
        res.status(500).json({ error: 'Failed to create item' });
      }
    },

    // 3. UPDATE (PUT /:id)
    update: async (req: any, res: any) => {
      const { dbClient } = req.globalContext;
      const { id } = req.params;
      try {
        const result = await dbClient
          .update(table)
          .set(req.body)
          .where(eq(table.id, id))
          .returning();
        res.json(result[0]);
      } catch (error) {
        console.error('Master Data Update Error:', error);
        res.status(500).json({ error: 'Failed to update item' });
      }
    },

    // 4. DELETE (DELETE /:id)
    delete: async (req: any, res: any) => {
      const { dbClient } = req.globalContext;
      const { id } = req.params;
      try {
        await dbClient
          .delete(table)
          .where(eq(table.id, id));
        res.json({ success: true });
      } catch (error) {
        console.error('Master Data Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
      }
    }
  };
};

// --- Helper to Register Routes ---
const registerRoutes = (path: string, table: any, orderByField: any) => {
  const handlers = createCrudHandlers(table, orderByField);
  router.get(path, handlers.list);
  router.post(path, handlers.create);
  router.put(`${path}/:id`, handlers.update);
  router.delete(`${path}/:id`, handlers.delete);
};

// --- Register All Master Data Entities ---

// 1. Bill Categories
registerRoutes('/bill-categories', schema.billCategories, schema.billCategories.createdAt);

// 2. Milestones
registerRoutes('/milestones', schema.milestones, schema.milestones.createdAt);

// 3. Invoice Statuses
registerRoutes('/invoice-statuses', schema.invoiceStatuses, schema.invoiceStatuses.createdAt);

// 4. GST Percentages (Ordered by Value)
registerRoutes('/gst-percentages', schema.gstPercentages, schema.gstPercentages.value);

// 5. States (Locations)
registerRoutes('/states', schema.states, schema.states.createdAt);

// 6. Project Modes
registerRoutes('/project-modes', schema.projectModes, schema.projectModes.name);

export { router as masterDataRouter };