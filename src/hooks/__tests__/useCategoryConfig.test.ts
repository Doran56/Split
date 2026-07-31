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

  it('after 2 distinct sliders have been touched, the 3rd absorbs the remainder while the other touched one stays fixed', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));

    // First touch (category 1): still proportional, since only 1 slider has been touched so far.
    await act(() => result.current.updatePercentage(1, 60));
    expect(result.current.drafts).toEqual({ 1: 60, 2: 24, 3: 16 });

    // Second touch (category 2): now locked — category 1 must stay exactly at 60 (not
    // rebalanced again), category 3 (untouched) absorbs whatever remains.
    await act(() => result.current.updatePercentage(2, 40));
    expect(result.current.drafts).toEqual({ 1: 60, 2: 40, 3: 0 });
  });

  it('touching the previously-untouched remainder promotes it, bumping the least-recently-touched slider to remainder', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));

    await act(() => result.current.updatePercentage(1, 60)); // touched: [1]
    await act(() => result.current.updatePercentage(2, 40)); // touched: [1, 2] -> 3 is remainder (0)
    expect(result.current.drafts).toEqual({ 1: 60, 2: 40, 3: 0 });

    // Touching 3 (the remainder) promotes it; 1 is the least-recently-touched of {1, 2},
    // so 1 becomes the new remainder while 2 stays fixed at 40.
    await act(() => result.current.updatePercentage(3, 30));
    expect(result.current.drafts).toEqual({ 3: 30, 2: 40, 1: 30 });
  });

  it('applyPreset overwrites all drafts and resets the touched-order tracking', async () => {
    const { result } = await renderHook(() => useCategoryConfig(categories));

    await act(() => result.current.updatePercentage(1, 60));
    await act(() => result.current.updatePercentage(2, 40)); // now locked: 1 fixed at 60, 3 remainder

    await act(() => result.current.applyPreset({ essentielles: 45, loisirs: 25, investissement: 30 }));
    expect(result.current.drafts).toEqual({ 1: 45, 2: 25, 3: 30 });

    // Touched-order should be reset: the very next move falls back to proportional again,
    // not the locked mode left over from before applyPreset.
    await act(() => result.current.updatePercentage(1, 55));
    expect(result.current.drafts[2]).not.toBe(25); // proportional redistribution moved it
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
