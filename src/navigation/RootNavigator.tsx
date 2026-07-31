import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { AssignBankAccountsScreen } from '../screens/AssignBankAccountsScreen';
import { CategoryConfigScreen } from '../screens/CategoryConfigScreen';
import { OnboardingHabitsScreen } from '../screens/OnboardingHabitsScreen';
import { OnboardingIncomeScreen } from '../screens/OnboardingIncomeScreen';
import { useOnboardingGate } from '../hooks/useOnboardingGate';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isHydrated, hasOnboarded } = useOnboardingGate();

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasOnboarded ? 'MainTabs' : 'OnboardingIncome'}
        screenOptions={{ headerShown: false }}
      >
        {!hasOnboarded ? (
          <>
            <Stack.Screen name="OnboardingIncome" component={OnboardingIncomeScreen} />
            <Stack.Screen name="OnboardingHabits" component={OnboardingHabitsScreen} />
            <Stack.Screen name="CategoryConfig" component={CategoryConfigScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="CategoryConfig" component={CategoryConfigScreen} />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ presentation: 'modal', headerShown: true, title: 'Nouvelle dépense' }}
            />
            <Stack.Screen
              name="AssignBankAccounts"
              component={AssignBankAccountsScreen}
              options={{ headerShown: true, title: 'Mes comptes bancaires' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
