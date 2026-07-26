import { StyleSheet, Text, View } from 'react-native';
import { formatCurrencyEUR } from '../services/locale';
import { colors } from '../theme/colors';
import type { BudgetSummaryItem } from '../types/budget';
import { ProgressBar } from './ProgressBar';

interface CategoryBudgetCardProps {
  item: BudgetSummaryItem;
}

export function CategoryBudgetCard({ item }: CategoryBudgetCardProps) {
  const isOverBudget = item.burnRate > 1;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
        <Text style={styles.allocated}>{formatCurrencyEUR(item.allocated)}</Text>
      </View>

      <ProgressBar ratio={item.burnRate} />

      <View style={styles.footer}>
        <Text style={styles.spent}>{formatCurrencyEUR(item.spent)} dépensés</Text>
        <Text style={[styles.remaining, isOverBudget && styles.over]}>
          {isOverBudget
            ? `${formatCurrencyEUR(Math.abs(item.remaining))} de dépassement`
            : `${formatCurrencyEUR(item.remaining)} restants`}
        </Text>
      </View>

      {item.pace.isAheadOfPace && !isOverBudget ? (
        <Text style={styles.paceHint}>Vous dépensez plus vite que prévu ce mois-ci.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  allocated: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  spent: {
    fontSize: 13,
    color: colors.textMuted,
  },
  remaining: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  over: {
    color: colors.danger,
  },
  paceHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.warning,
  },
});
