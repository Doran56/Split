import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';
import * as bankApi from '../services/bankApi';
import * as categoriesRepo from '../services/categoriesRepo';
import * as expensesRepo from '../services/expensesRepo';
import * as secureStorage from '../services/secureStorage';
import * as settingsRepo from '../services/settingsRepo';
import type { BankConnectionState } from '../types/bank';
import type { Category, CategoryPctUpdate, Expense, NewExpenseInput, Settings } from '../types/budget';

const INITIAL_BANK_CONNECTION: BankConnectionState = {
  status: 'none',
  balance: null,
  currency: null,
  updatedAt: null,
  errorMessage: null,
};

interface BudgetState {
  isHydrated: boolean;
  income: number;
  habits: { currentEssentialSpend: number | null; currentLeisureSpend: number | null };
  hasOnboarded: boolean;
  categories: Category[];
  monthExpenses: Expense[];
  bankConnection: BankConnectionState;

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
  connectBankAccount: (userEmail: string, callbackUrl: string) => Promise<{ connectUrl: string }>;
  refreshBankBalance: () => Promise<void>;
  disconnectBankAccount: () => Promise<void>;
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
  bankConnection: INITIAL_BANK_CONNECTION,

  hydrate: async (db) => {
    const [settings, categories, monthExpenses] = await Promise.all([
      settingsRepo.getSettings(db),
      categoriesRepo.getCategories(db),
      fetchCurrentMonthExpenses(db),
    ]);
    set({ ...applySettings(settings), categories, monthExpenses, isHydrated: true });

    // Ne bloque pas le rendu de l'app sur le stockage sécurisé / un appel réseau au backend bancaire.
    try {
      const bankUserUuid = await secureStorage.getBankUserUuid();
      if (bankUserUuid) {
        get().refreshBankBalance();
      }
    } catch {
      // Le solde bancaire reste simplement non chargé ; l'utilisateur peut retenter depuis Home.
    }
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

  connectBankAccount: async (userEmail, callbackUrl) => {
    set({ bankConnection: { ...get().bankConnection, status: 'connecting', errorMessage: null } });
    try {
      let userUuid = await secureStorage.getBankUserUuid();
      if (!userUuid) {
        const created = await bankApi.createBridgeUser();
        userUuid = created.userUuid;
        await secureStorage.setBankUserUuid(userUuid);
      }
      return await bankApi.createConnectSession(userUuid, userEmail, callbackUrl);
    } catch (error) {
      set({
        bankConnection: {
          ...get().bankConnection,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue.',
        },
      });
      throw error;
    }
  },

  refreshBankBalance: async () => {
    try {
      const userUuid = await secureStorage.getBankUserUuid();
      if (!userUuid) {
        set({ bankConnection: INITIAL_BANK_CONNECTION });
        return;
      }

      set({ bankConnection: { ...get().bankConnection, status: 'connecting', errorMessage: null } });
      const result = await bankApi.fetchBankBalance(userUuid);
      set({
        bankConnection: {
          status: 'connected',
          balance: result.balance,
          currency: result.currency,
          updatedAt: result.updatedAt,
          errorMessage: null,
        },
      });
    } catch (error) {
      set({
        bankConnection: {
          ...get().bankConnection,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue.',
        },
      });
    }
  },

  disconnectBankAccount: async () => {
    try {
      await secureStorage.clearBankUserUuid();
    } catch {
      // Best-effort : on réinitialise l'état local même si l'effacement du stockage échoue.
    }
    set({ bankConnection: INITIAL_BANK_CONNECTION });
  },
}));

export function useIsHydrated() {
  return useBudgetStore((state) => state.isHydrated);
}

export function useHasOnboarded() {
  return useBudgetStore((state) => state.hasOnboarded);
}
