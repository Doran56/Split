import {
  buildBudgetSummary,
  computeAllocations,
  computeBurnRate,
  computeDailyPace,
  computeSpentByCategory,
} from '../budget';
import type { Category, Expense } from '../../types/budget';

const categories: Category[] = [
  { id: 1, key: 'essentielles', label: 'Dépenses essentielles', percentage: 50, color: '#2F6FED', sortOrder: 0 },
  { id: 2, key: 'loisirs', label: 'Loisirs', percentage: 30, color: '#F5A623', sortOrder: 1 },
  { id: 3, key: 'investissement', label: 'Investissement', percentage: 20, color: '#2FB380', sortOrder: 2 },
];

describe('computeAllocations', () => {
  it('splits income according to category percentages', () => {
    const allocations = computeAllocations(2000, categories);
    expect(allocations).toEqual([
      expect.objectContaining({ categoryId: 1, allocated: 1000 }),
      expect.objectContaining({ categoryId: 2, allocated: 600 }),
      expect.objectContaining({ categoryId: 3, allocated: 400 }),
    ]);
  });

  it('returns zero allocations for zero income', () => {
    const allocations = computeAllocations(0, categories);
    expect(allocations.every((a) => a.allocated === 0)).toBe(true);
  });
});

describe('computeSpentByCategory', () => {
  it('sums expenses per category and defaults unconfigured categories to zero', () => {
    const expenses: Expense[] = [
      { id: 1, categoryId: 1, amount: 100, date: '2026-07-01', note: null, createdAt: '' },
      { id: 2, categoryId: 1, amount: 50, date: '2026-07-05', note: null, createdAt: '' },
      { id: 3, categoryId: 2, amount: 30, date: '2026-07-10', note: null, createdAt: '' },
    ];
    const totals = computeSpentByCategory(expenses, categories);
    expect(totals).toEqual({ 1: 150, 2: 30, 3: 0 });
  });

  it('returns all zeros for an empty expense list', () => {
    const totals = computeSpentByCategory([], categories);
    expect(totals).toEqual({ 1: 0, 2: 0, 3: 0 });
  });
});

describe('computeBurnRate', () => {
  it('divides spent by allocated', () => {
    expect(computeBurnRate(50, 100)).toBe(0.5);
  });

  it('guards against a zero-allocated category with no spend', () => {
    expect(computeBurnRate(0, 0)).toBe(0);
  });

  it('guards against a zero-allocated category with spend', () => {
    expect(computeBurnRate(10, 0)).toBe(Infinity);
  });
});

describe('computeDailyPace', () => {
  it('flags overspending ahead of pace', () => {
    const pace = computeDailyPace(300, 200, 30, 10);
    expect(pace.expectedSpentByNow).toBeCloseTo(100);
    expect(pace.isAheadOfPace).toBe(true);
    expect(pace.remainingBudget).toBeCloseTo(100);
  });

  it('does not flag pace when spend matches the ideal trajectory', () => {
    const pace = computeDailyPace(300, 100, 30, 10);
    expect(pace.isAheadOfPace).toBe(false);
  });
});

describe('buildBudgetSummary', () => {
  it('composes allocations, spend and pace into a single summary per category', () => {
    const expenses: Expense[] = [
      { id: 1, categoryId: 1, amount: 400, date: '2026-07-01', note: null, createdAt: '' },
    ];
    const now = new Date(2026, 6, 15); // July 15th, 2026 -> 31 days in month
    const summary = buildBudgetSummary(2000, categories, expenses, now);

    const essential = summary.find((s) => s.categoryId === 1)!;
    expect(essential.allocated).toBe(1000);
    expect(essential.spent).toBe(400);
    expect(essential.remaining).toBe(600);
    expect(essential.burnRate).toBeCloseTo(0.4);

    const investment = summary.find((s) => s.categoryId === 3)!;
    expect(investment.spent).toBe(0);
    expect(investment.remaining).toBe(400);
  });
});
