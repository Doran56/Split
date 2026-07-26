import { useMemo } from 'react';
import { buildBudgetSummary } from '../services/budget';
import { round2 } from '../services/locale';
import { useBudgetStore } from '../store/useBudgetStore';

export function useBudgetSummary() {
  const income = useBudgetStore((state) => state.income);
  const categories = useBudgetStore((state) => state.categories);
  const monthExpenses = useBudgetStore((state) => state.monthExpenses);
  const isHydrated = useBudgetStore((state) => state.isHydrated);

  const summary = useMemo(
    () => buildBudgetSummary(income, categories, monthExpenses, new Date()),
    [income, categories, monthExpenses]
  );

  const totalAllocated = useMemo(() => round2(summary.reduce((sum, s) => sum + s.allocated, 0)), [summary]);
  const totalSpent = useMemo(() => round2(summary.reduce((sum, s) => sum + s.spent, 0)), [summary]);

  return { summary, totalAllocated, totalSpent, isLoading: !isHydrated };
}
