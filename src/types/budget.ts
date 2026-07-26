export type CategoryKey = 'essentielles' | 'loisirs' | 'investissement';

export interface Category {
  id: number;
  key: CategoryKey;
  label: string;
  percentage: number;
  color: string;
  sortOrder: number;
}

export interface Settings {
  income: number;
  currentEssentialSpend: number | null;
  currentLeisureSpend: number | null;
  hasOnboarded: boolean;
}

export interface Expense {
  id: number;
  categoryId: number;
  amount: number;
  date: string; // ISO 'YYYY-MM-DD'
  note: string | null;
  createdAt: string;
}

export interface NewExpenseInput {
  categoryId: number;
  amount: number;
  date: string;
  note?: string | null;
}

export interface CategoryPctUpdate {
  id: number;
  percentage: number;
}

export interface Allocation {
  categoryId: number;
  key: CategoryKey;
  label: string;
  color: string;
  allocated: number;
}

export interface DailyPace {
  expectedSpentByNow: number;
  idealDailyBudget: number;
  remainingBudget: number;
  suggestedDailySpend: number;
  isAheadOfPace: boolean;
}

export interface BudgetSummaryItem extends Allocation {
  spent: number;
  remaining: number;
  burnRate: number;
  pace: DailyPace;
}

export interface Recommendation {
  essential: number;
  leisure: number;
  investment: number;
  message: string;
}
