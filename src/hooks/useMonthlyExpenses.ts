import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';

export function useMonthlyExpenses() {
  const db = useSQLiteContext();
  const monthExpenses = useBudgetStore((state) => state.monthExpenses);
  const refreshMonthExpenses = useBudgetStore((state) => state.refreshMonthExpenses);

  const refresh = useCallback(() => refreshMonthExpenses(db), [db, refreshMonthExpenses]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { monthExpenses, refresh };
}
