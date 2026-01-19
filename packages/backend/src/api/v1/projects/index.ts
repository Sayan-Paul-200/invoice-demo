import { Router } from 'express';
import { 
  listProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject 
} from './handlers';

const router = Router();

// GET
router.get('/', listProjects);
router.get('/:id', getProject);

// POST (Admin)
router.post('/', createProject);

// PUT (Admin) - Corrected from PATCH to PUT
router.put('/:id', updateProject);

// DELETE (Admin)
router.delete('/:id', deleteProject);

export { router as projectsRouter };