import { useBudgetStore } from '../store/useBudgetStore';

export function useOnboardingGate() {
  const isHydrated = useBudgetStore((state) => state.isHydrated);
  const hasOnboarded = useBudgetStore((state) => state.hasOnboarded);
  return { isHydrated, hasOnboarded };
}
