import { Router } from 'express';
import { 
  listInvoices, 
  getInvoice, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice 
} from './handlers';

const router = Router();

router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.patch('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export { router as invoicesRouter };