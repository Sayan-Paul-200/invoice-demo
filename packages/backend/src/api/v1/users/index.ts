import { Router } from 'express';
import { listUsers, createUser, assignProject, updateUserStatus, updateUser, deleteUser } from './handlers';

const router = Router();

// Middleware: Ensure only Admins can access user management
const adminOnly = (req: any, res: any, next: any) => {
  if (req.context.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

router.use(adminOnly);

// Routes
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/assign-project', assignProject);
router.patch('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

export { router as usersRouter };