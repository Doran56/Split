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

/**
 * Sums the balances of accounts assigned to a category (via bank_account_assignments).
 * Accounts with no assignment are ignored. Multiple accounts can share a category.
 */
export function computeRealBalanceByCategory(
  accounts: { id: string; balance: number }[],
  assignments: Record<string, number>
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const account of accounts) {
    const categoryId = assignments[account.id];
    if (categoryId != null) {
      result[categoryId] = round2((result[categoryId] ?? 0) + account.balance);
    }
  }
  return result;
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

/**
 * Categories with a real balance (assigned bank account(s)) use that balance as the source
 * of truth for "remaining", replacing manually logged expenses entirely for that category:
 * `spent` is derived as `allocated - realBalance` (floored at 0 — a balance above the
 * allocation just means "nothing spent yet, plus rollover", never a negative spend).
 * Categories with no assigned account keep the existing manual-expense-based calculation.
 */
export function buildBudgetSummary(
  income: number,
  categories: Category[],
  expenses: Expense[],
  now: Date,
  realBalanceByCategory: Record<number, number> = {}
): BudgetSummaryItem[] {
  const allocations = computeAllocations(income, categories);
  const spentMap = computeSpentByCategory(expenses, categories);
  const daysInMonth = getDaysInMonth(now);
  const daysElapsed = getDate(now);

  return allocations.map((allocation) => {
    const realBalance = realBalanceByCategory[allocation.categoryId];
    const isRealBalance = realBalance !== undefined;

    const spent = isRealBalance
      ? round2(Math.max(0, allocation.allocated - realBalance))
      : spentMap[allocation.categoryId] ?? 0;
    const remaining = isRealBalance ? round2(realBalance) : round2(allocation.allocated - spent);

    return {
      ...allocation,
      spent,
      remaining,
      isRealBalance,
      burnRate: computeBurnRate(spent, allocation.allocated),
      pace: computeDailyPace(allocation.allocated, spent, daysInMonth, daysElapsed),
    };
  });
}
