import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';
import * as categoriesRepo from '../services/categoriesRepo';
import * as expensesRepo from '../services/expensesRepo';
import * as settingsRepo from '../services/settingsRepo';
import type { Category, CategoryPctUpdate, Expense, NewExpenseInput, Settings } from '../types/budget';

interface BudgetState {
  isHydrated: boolean;
  income: number;
  habits: { currentEssentialSpend: number | null; currentLeisureSpend: number | null };
  hasOnboarded: boolean;
  categories: Category[];
  monthExpenses: Expense[];

  hydrate: (db: SQLiteDatabase) => Promise<void>;
  setIncome: (db: SQLiteDatabase, income: number) => Promise<void>;
  setHabits: (
    db: SQLiteDatabase,
    habits: { currentEssentialSpend: number; currentLeisureSpend: number }
  ) => Promise<void>;
  setCategoryPercentages: (db: SQLiteDatabase, updates: CategoryPctUpdate[]) => Promise<void>;
  completeOnboarding: (db: SQLiteDatabase) => Promise<void>;
  addExpense: (db: SQLiteDatabase, input: NewExpenseInput) => Promise<void>;
  refreshMonthExpenses: (db: SQLiteDatabase) => Promise<void>;
}

function applySettings(settings: Settings) {
  return {
    income: settings.income,
    habits: {
      currentEssentialSpend: settings.currentEssentialSpend,
      currentLeisureSpend: settings.currentLeisureSpend,
    },
    hasOnboarded: settings.hasOnboarded,
  };
}

async function fetchCurrentMonthExpenses(db: SQLiteDatabase): Promise<Expense[]> {
  const now = new Date();
  return expensesRepo.getExpensesForMonth(db, now.getFullYear(), now.getMonth() + 1);
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  isHydrated: false,
  income: 0,
  habits: { currentEssentialSpend: null, currentLeisureSpend: null },
  hasOnboarded: false,
  categories: [],
  monthExpenses: [],

  hydrate: async (db) => {
    const [settings, categories, monthExpenses] = await Promise.all([
      settingsRepo.getSettings(db),
      categoriesRepo.getCategories(db),
      fetchCurrentMonthExpenses(db),
    ]);
    set({ ...applySettings(settings), categories, monthExpenses, isHydrated: true });
  },

  setIncome: async (db, income) => {
    await settingsRepo.setIncome(db, income);
    const settings = await settingsRepo.getSettings(db);
    set(applySettings(settings));
  },

  setHabits: async (db, habits) => {
    await settingsRepo.setHabits(db, habits);
    const settings = await settingsRepo.getSettings(db);
    set(applySettings(settings));
  },

  setCategoryPercentages: async (db, updates) => {
    await categoriesRepo.saveCategoryPercentages(db, updates);
    const categories = await categoriesRepo.getCategories(db);
    set({ categories });
  },

  completeOnboarding: async (db) => {
    await settingsRepo.setOnboarded(db, true);
    const settings = await settingsRepo.getSettings(db);
    set(applySettings(settings));
  },

  addExpense: async (db, input) => {
    await expensesRepo.addExpense(db, input);
    const monthExpenses = await fetchCurrentMonthExpenses(db);
    set({ monthExpenses });
  },

  refreshMonthExpenses: async (db) => {
    const monthExpenses = await fetchCurrentMonthExpenses(db);
    set({ monthExpenses });
  },
}));

export function useIsHydrated() {
  return useBudgetStore((state) => state.isHydrated);
}

export function useHasOnboarded() {
  return useBudgetStore((state) => state.hasOnboarded);
}
