import { Router } from 'express';
import { createExpense, getExpenses, deleteExpense, getMonthlyReport } from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createExpense);
router.get('/', authenticateToken, getExpenses);
router.delete('/:id', authenticateToken, deleteExpense);
router.get('/monthly-report', authenticateToken, getMonthlyReport);

export default router;
