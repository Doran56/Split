import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BankBalanceCard } from '../components/BankBalanceCard';
import { CategoryBudgetCard } from '../components/CategoryBudgetCard';
import { EmptyState } from '../components/EmptyState';
import { useBudgetSummary } from '../hooks/useBudgetSummary';
import { useMonthlyExpenses } from '../hooks/useMonthlyExpenses';
import { formatCurrencyEUR } from '../services/locale';
import { colors } from '../theme/colors';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const MONTH_LABEL = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date());

export function HomeScreen({ navigation }: Props) {
  useMonthlyExpenses();
  const { summary, totalAllocated, totalSpent } = useBudgetSummary();

  const hasBudgetConfigured = totalAllocated > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.month}>{capitalize(MONTH_LABEL)}</Text>

        <BankBalanceCard />

        <View style={styles.totalsRow}>
          <View>
            <Text style={styles.totalsLabel}>Alloué</Text>
            <Text style={styles.totalsValue}>{formatCurrencyEUR(totalAllocated)}</Text>
          </View>
          <View>
            <Text style={styles.totalsLabel}>Dépensé</Text>
            <Text style={styles.totalsValue}>{formatCurrencyEUR(totalSpent)}</Text>
          </View>
        </View>

        {!hasBudgetConfigured ? (
          <EmptyState
            title="Aucun budget configuré"
            description="Renseignez votre revenu et vos pourcentages pour voir votre budget ici."
          />
        ) : (
          summary.map((item) => <CategoryBudgetCard key={item.categoryId} item={item} />)
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </View>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  month: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  totalsLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  totalsValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },
});
