import { Router } from 'express';
import { authenticateRouter } from './authenticate';

const router = Router();

router.use('/authenticate', authenticateRouter);

export { router as IAMv1Router };