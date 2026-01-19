import { Router } from 'express';
import { addContext } from '../../utils/middlewares';

// Import domain routers here
import { invoicesRouter } from './invoices';
import { masterDataRouter } from './master-data';
import { projectsRouter } from './projects';
import { storageRouter } from './storage';
import { usersRouter } from './users'

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'API v1 Online', context: req.context });
});

// 1. Storage Router (Partially Public)
router.use('/storage', storageRouter);

// 2. Domain Routes (Fully Protected)
router.use('/invoices', addContext, invoicesRouter);
router.use('/master-data', addContext, masterDataRouter);
router.use('/projects', addContext, projectsRouter);
router.use('/users', addContext, usersRouter);

export { router as APIv1Router };