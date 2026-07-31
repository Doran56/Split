import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
};

export type RootStackParamList = {
  OnboardingIncome: undefined;
  OnboardingHabits: undefined;
  CategoryConfig: { fromSettings?: boolean } | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AddExpense: undefined;
  AssignBankAccounts: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
