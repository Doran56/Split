import { act, renderHook } from '@testing-library/react-native';
import { useCategoryConfig } from '../useCategoryConfig';
import type { Category } from '../../types/budget';

const categories: Category[] = [
  { id: 1, key: 'essentielles', label: 'Dépenses essentielles', percentage: 50, color: '#2F6FED', sortOrder: 0 },
  { id: 2, key: 'loisirs', label: 'Loisirs', percentage: 30, color: '#F5A623', sortOrder: 1 },
  { id: 3, key: 'investissement', label: 'Investissement', percentage: 20, color: '#2FB380', sortOrder: 2 },
];

function total(drafts: Record<number, number>) {
  return Math.round(Object.values(drafts).reduce((s, v) => s + v, 0) * 10) / 10;
}

describe('useCategoryConfig', () => {
  it('initializes drafts from category percentages and reports a valid total', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));
    expect(result.current.drafts).toEqual({ 1: 50, 2: 30, 3: 20 });
    expect(result.current.total).toBe(100);
    expect(result.current.isValid).toBe(true);
  });

  it('initializes drafts from a recommendation when provided', async () => {
    const { result } = await renderHook(() =>
      useCategoryConfig(categories, { essentielles: 40, loisirs: 20, investissement: 40 })
    );
    expect(result.current.drafts).toEqual({ 1: 40, 2: 20, 3: 40 });
  });

  it('always keeps the total at exactly 100 after any single slider move', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));

    await act(() => result.current.updatePercentage(1, 70));
    expect(total(result.current.drafts)).toBe(100);

    await act(() => result.current.updatePercentage(3, 0));
    expect(total(result.current.drafts)).toBe(100);

    await act(() => result.current.updatePercentage(2, 100));
    expect(total(result.current.drafts)).toBe(100);
    expect(result.current.drafts[2]).toBe(100);
  });

  it('never lets a category go negative and keeps a zeroed-out category at zero while others absorb changes', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));

    await act(() => result.current.updatePercentage(2, 0));
    expect(result.current.drafts[2]).toBe(0);
    expect(total(result.current.drafts)).toBe(100);

    await act(() => result.current.updatePercentage(1, 90));
    expect(result.current.drafts[2]).toBe(0);
    expect(Object.values(result.current.drafts).every((v) => v >= 0)).toBe(true);
    expect(total(result.current.drafts)).toBe(100);
  });

  it('produces CategoryPctUpdate entries matching the current drafts', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));
    await act(() => result.current.updatePercentage(1, 60));
    const updates = result.current.toUpdates();
    expect(updates).toEqual(
      expect.arrayContaining([
        { id: 1, percentage: result.current.drafts[1] },
        { id: 2, percentage: result.current.drafts[2] },
        { id: 3, percentage: result.current.drafts[3] },
      ])
    );
  });
});
