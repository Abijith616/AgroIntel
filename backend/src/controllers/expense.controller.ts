import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}

// Create an expense
export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { cropId, category, amount, description, date } = req.body;

        if (!category || !amount || !description) {
            res.status(400).json({ error: 'Category, amount, and description are required.' });
            return;
        }

        const expense = await prisma.expense.create({
            data: {
                userId,
                cropId: cropId ? parseInt(cropId) : null,
                category,
                amount: parseFloat(amount),
                description,
                date: date ? new Date(date) : new Date(),
            },
            include: { crop: { select: { name: true } } }
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
};

// Get all expenses (with optional month/year filter)
export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { month, year } = req.query;

        let dateFilter: { gte?: Date; lte?: Date } | undefined;
        if (month && year) {
            const m = parseInt(month as string);
            const y = parseInt(year as string);
            dateFilter = {
                gte: new Date(y, m - 1, 1),
                lte: new Date(y, m, 0, 23, 59, 59),
            };
        }

        const expenses = await prisma.expense.findMany({
            where: {
                userId,
                ...(dateFilter ? { date: dateFilter } : {})
            },
            include: { crop: { select: { id: true, name: true } } },
            orderBy: { date: 'desc' }
        });

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

// Delete an expense
export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const expenseId = parseInt(req.params.id);
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
        if (!existing) { res.status(404).json({ error: 'Expense not found' }); return; }

        await prisma.expense.delete({ where: { id: expenseId } });
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};

// Generate Monthly Report
export const getMonthlyReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const now = new Date();
        const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
        const year = parseInt((req.query.year as string) || String(now.getFullYear()));

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get user info
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true } });

        // Get crops
        const crops = await prisma.crop.findMany({ where: { userId } });

        // Get this month's expenses
        const expenses = await prisma.expense.findMany({
            where: { userId, date: { gte: startDate, lte: endDate } },
            include: { crop: { select: { id: true, name: true } } },
            orderBy: { date: 'asc' }
        });

        // Group expenses by category
        const categoryTotals: Record<string, number> = {};
        for (const exp of expenses) {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        }

        // Group expenses by crop
        const cropTotals: Record<string, { cropName: string; total: number }> = {};
        for (const exp of expenses) {
            const key = exp.cropId ? String(exp.cropId) : 'general';
            const label = exp.crop?.name || 'General';
            if (!cropTotals[key]) cropTotals[key] = { cropName: label, total: 0 };
            cropTotals[key].total += exp.amount;
        }

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Last month comparison
        const lastMonthStart = new Date(year, month - 2, 1);
        const lastMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);
        const lastMonthExpenses = await prisma.expense.findMany({
            where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } }
        });
        const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const changePercent = lastMonthTotal > 0
            ? Math.round(((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100)
            : null;

        res.json({
            reportMonth: month,
            reportYear: year,
            generatedAt: new Date().toISOString(),
            user,
            summary: {
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                totalCrops: crops.length,
                expenseCount: expenses.length,
                lastMonthTotal: Math.round(lastMonthTotal * 100) / 100,
                changePercent,
            },
            crops,
            categoryBreakdown: Object.entries(categoryTotals).map(([category, total]) => ({
                category,
                total: Math.round(total * 100) / 100,
                percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0
            })).sort((a, b) => b.total - a.total),
            cropBreakdown: Object.values(cropTotals).sort((a, b) => b.total - a.total),
            expenses,
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};
