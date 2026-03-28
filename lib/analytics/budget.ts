import { prisma } from '@/lib/db';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export type BudgetCategory = 
  | 'labor'
  | 'materials'
  | 'equipment'
  | 'subcontractors'
  | 'permits'
  | 'insurance'
  | 'overhead'
  | 'contingency'
  | 'other';

export interface BudgetItemData {
  id: string;
  name: string;
  category: BudgetCategory;
  amount: number;
  lastUpdated: Date;
}

export interface BudgetOverview {
  totalBudget: number;
  items: BudgetItemData[];
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  itemId: string;
  itemName: string;
  type: 'over_budget' | 'threshold' | 'under_budget';
  message: string;
  amount: number;
}

export async function getBudgetOverview(projectId: string): Promise<BudgetOverview> {
  const budgetItems = await prisma.costItem.findMany({
    where: { projectId },
    orderBy: { category: 'asc' },
  });

  const totalBudget = budgetItems.reduce((sum: number, item: any) => sum + item.amount, 0);

  const items: BudgetItemData[] = budgetItems.map((item: any) => ({
    id: item.id,
    name: item.description,
    category: (item.category as BudgetCategory) || 'other',
    amount: item.amount,
    lastUpdated: item.updatedAt,
  }));

  const alerts: BudgetAlert[] = items
    .filter(item => item.amount > totalBudget * 0.5)
    .map(item => ({
      itemId: item.id,
      itemName: item.name,
      type: 'threshold' as const,
      message: `${item.name} represents ${((item.amount / totalBudget) * 100).toFixed(1)}% of total budget`,
      amount: item.amount,
    }));

  return { totalBudget, items, alerts };
}

export async function getBudgetByCategory(projectId: string): Promise<{ category: BudgetCategory; amount: number }[]> {
  const budgetItems = await prisma.costItem.findMany({
    where: { projectId },
  });

  const categoryTotals: Record<BudgetCategory, number> = {
    labor: 0,
    materials: 0,
    equipment: 0,
    subcontractors: 0,
    permits: 0,
    insurance: 0,
    overhead: 0,
    contingency: 0,
    other: 0,
  };

  budgetItems.forEach((item: any) => {
    const category = (item.category as BudgetCategory) || 'other';
    if (category in categoryTotals) {
      categoryTotals[category] += item.amount;
    }
  });

  return Object.entries(categoryTotals).map(([category, amount]) => ({
    category: category as BudgetCategory,
    amount,
  }));
}

export async function getProjectBudgetSummary(): Promise<{
  projectId: string;
  projectName: string;
  totalBudget: number;
}[]> {
  const projects = await prisma.project.findMany({
    include: { costItems: true },
  });

  return projects.map((project: any) => ({
    projectId: project.id,
    projectName: project.name,
    totalBudget: project.costItems.reduce((sum: number, item: any) => sum + item.amount, 0),
  }));
}
