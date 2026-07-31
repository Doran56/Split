import { useCallback, useMemo, useState } from 'react';
import { clamp, round1 } from '../services/locale';
import type { Category, CategoryPctUpdate } from '../types/budget';

type Drafts = Record<number, number>;

interface ConfigState {
  drafts: Drafts;
  /** Ids des catégories touchées par l'utilisateur, du plus ancien au plus récent. */
  touchedOrder: number[];
}

function initDrafts(categories: Category[], initial?: Partial<Record<string, number>>): Drafts {
  return Object.fromEntries(categories.map((c) => [c.id, initial?.[c.key] ?? c.percentage]));
}

/**
 * Redistribue le delta d'une catégorie sur les autres, proportionnellement à leur part actuelle
 * du total restant, puis corrige la dérive d'arrondi en l'ajoutant à la plus grande des autres
 * catégories (jamais celle qu'on vient de modifier), pour garantir un total exactement à 100.
 * Utilisé tant que l'utilisateur n'a pas encore touché 2 curseurs distincts.
 */
function rebalanceProportional(prev: Drafts, categories: Category[], changedId: number, newVal: number): Drafts {
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

/**
 * Une fois que l'utilisateur a touché 2 curseurs distincts, ces deux-là restent exactement à la
 * valeur qu'il leur a donnée : c'est le 3ème (le moins récemment touché, ou jamais touché) qui
 * absorbe seul le reliquat pour que le total reste à 100. Toucher un curseur qui était jusque-là
 * le "reliquat" le fait rejoindre la paire active, et le moins récent des deux anciens actifs
 * devient à son tour le reliquat.
 */
function rebalanceLocked(prev: Drafts, categories: Category[], touchedOrder: number[], changedId: number, newVal: number): Drafts {
  const otherActiveId = touchedOrder.slice(-2, -1)[0];
  const remainderCategory = categories.find((c) => c.id !== changedId && c.id !== otherActiveId);
  if (otherActiveId === undefined || !remainderCategory) {
    return rebalanceProportional(prev, categories, changedId, newVal);
  }

  const otherActiveVal = prev[otherActiveId] ?? 0;
  let finalNewVal = newVal;
  let remainderVal = round1(100 - finalNewVal - otherActiveVal);
  if (remainderVal < 0) {
    remainderVal = 0;
    finalNewVal = clamp(round1(100 - otherActiveVal), 0, 100);
  }

  return {
    ...prev,
    [changedId]: finalNewVal,
    [otherActiveId]: otherActiveVal,
    [remainderCategory.id]: remainderVal,
  };
}

export function useCategoryConfig(categories: Category[], initialPercentages?: Partial<Record<string, number>>) {
  const [state, setState] = useState<ConfigState>(() => ({
    drafts: initDrafts(categories, initialPercentages),
    touchedOrder: [],
  }));

  const updatePercentage = useCallback(
    (id: number, rawValue: number) => {
      setState((prev) => {
        const newVal = clamp(round1(rawValue), 0, 100);
        const touchedOrder = [...prev.touchedOrder.filter((existingId) => existingId !== id), id];
        const drafts =
          touchedOrder.length < 2
            ? rebalanceProportional(prev.drafts, categories, id, newVal)
            : rebalanceLocked(prev.drafts, categories, touchedOrder, id, newVal);
        return { drafts, touchedOrder };
      });
    },
    [categories]
  );

  /** Remplace tous les curseurs par un jeu de valeurs (ex: la recommandation), et repart à zéro
   * pour le suivi "touché" — l'utilisateur peut ensuite réajuster librement à partir de là. */
  const applyPreset = useCallback(
    (preset: Partial<Record<string, number>>) => {
      setState({ drafts: initDrafts(categories, preset), touchedOrder: [] });
    },
    [categories]
  );

  const total = useMemo(() => round1(Object.values(state.drafts).reduce((sum, v) => sum + v, 0)), [state.drafts]);
  const isValid = total === 100;

  const toUpdates = useCallback(
    (): CategoryPctUpdate[] => categories.map((c) => ({ id: c.id, percentage: state.drafts[c.id] ?? 0 })),
    [categories, state.drafts]
  );

  return { drafts: state.drafts, updatePercentage, applyPreset, total, isValid, toUpdates };
}
