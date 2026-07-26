import { useCallback, useMemo, useState } from 'react';
import { clamp, round1 } from '../services/locale';
import type { Category, CategoryPctUpdate } from '../types/budget';

type Drafts = Record<number, number>;

function initDrafts(categories: Category[], initial?: Partial<Record<string, number>>): Drafts {
  return Object.fromEntries(categories.map((c) => [c.id, initial?.[c.key] ?? c.percentage]));
}

/**
 * Redistribue le delta d'une catégorie sur les autres, proportionnellement à leur part actuelle
 * du total restant, puis corrige la dérive d'arrondi en l'ajoutant à la plus grande des autres
 * catégories (jamais celle qu'on vient de modifier), pour garantir un total exactement à 100.
 */
function rebalance(prev: Drafts, categories: Category[], changedId: number, rawNewVal: number): Drafts {
  const newVal = clamp(round1(rawNewVal), 0, 100);
  const oldVal = prev[changedId] ?? 0;
  const delta = newVal - oldVal;
  const others = categories.filter((c) => c.id !== changedId);
  const othersSum = others.reduce((sum, c) => sum + (prev[c.id] ?? 0), 0);

  const next: Drafts = { ...prev, [changedId]: newVal };
  for (const category of others) {
    const current = prev[category.id] ?? 0;
    const share = othersSum > 0 ? current / othersSum : 1 / others.length;
    next[category.id] = clamp(round1(current - delta * share), 0, 100);
  }

  if (others.length > 0) {
    const sum = round1(Object.values(next).reduce((s, v) => s + v, 0));
    const residual = round1(100 - sum);
    if (residual !== 0) {
      const largestOther = others.reduce((a, b) => (next[b.id] > next[a.id] ? b : a));
      next[largestOther.id] = clamp(round1(next[largestOther.id] + residual), 0, 100);
    }
  }

  return next;
}

export function useCategoryConfig(categories: Category[], initialPercentages?: Partial<Record<string, number>>) {
  const [drafts, setDrafts] = useState<Drafts>(() => initDrafts(categories, initialPercentages));

  const updatePercentage = useCallback(
    (id: number, value: number) => {
      setDrafts((prev) => rebalance(prev, categories, id, value));
    },
    [categories]
  );

  const total = useMemo(() => round1(Object.values(drafts).reduce((sum, v) => sum + v, 0)), [drafts]);
  const isValid = total === 100;

  const toUpdates = useCallback(
    (): CategoryPctUpdate[] => categories.map((c) => ({ id: c.id, percentage: drafts[c.id] ?? 0 })),
    [categories, drafts]
  );

  return { drafts, updatePercentage, total, isValid, toUpdates };
}
