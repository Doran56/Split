import { getDate, getDaysInMonth } from 'date-fns';
import type { Allocation, BudgetSummaryItem, Category, DailyPace, Expense } from '../types/budget';
import { round2 } from './locale';

export function computeAllocations(income: number, categories: Category[]): Allocation[] {
  return categories.map((category) => ({
    categoryId: category.id,
    key: category.key,
    label: category.label,
    color: category.color,
    allocated: round2(income * (category.percentage / 100)),
  }));
}

export function computeSpentByCategory(expenses: Expense[], categories: Category[]): Record<number, number> {
  const totals: Record<number, number> = Object.fromEntries(categories.map((c) => [c.id, 0]));
  for (const expense of expenses) {
    totals[expense.categoryId] = round2((totals[expense.categoryId] ?? 0) + expense.amount);
  }
  return totals;
}

export function computeBurnRate(spent: number, allocated: number): number {
  if (allocated <= 0) return spent > 0 ? Infinity : 0;
  return spent / allocated;
}

export function computeDailyPace(
  allocated: number,
  spent: number,
  daysInMonth: number,
  daysElapsed: number
): DailyPace {
  const expectedSpentByNow = round2(allocated * (daysElapsed / daysInMonth));
  const idealDailyBudget = round2(allocated / daysInMonth);
  const remainingDays = Math.max(daysInMonth - daysElapsed, 1);
  const remainingBudget = round2(allocated - spent);
  const suggestedDailySpend = round2(remainingBudget / remainingDays);
  return {
    expectedSpentByNow,
    idealDailyBudget,
    remainingBudget,
    suggestedDailySpend,
    isAheadOfPace: spent > expectedSpentByNow,
  };
}

export function buildBudgetSummary(
  income: number,
  categories: Category[],
  expenses: Expense[],
  now: Date
): BudgetSummaryItem[] {
  const allocations = computeAllocations(income, categories);
  const spentMap = computeSpentByCategory(expenses, categories);
  const daysInMonth = getDaysInMonth(now);
  const daysElapsed = getDate(now);

  return allocations.map((allocation) => {
    const spent = spentMap[allocation.categoryId] ?? 0;
    return {
      ...allocation,
      spent,
      remaining: round2(allocation.allocated - spent),
      burnRate: computeBurnRate(spent, allocation.allocated),
      pace: computeDailyPace(allocation.allocated, spent, daysInMonth, daysElapsed),
    };
  });
}
