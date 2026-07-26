import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategorySlider } from '../components/CategorySlider';
import { PrimaryButton } from '../components/PrimaryButton';
import { useCategoryConfig } from '../hooks/useCategoryConfig';
import { recommendAllocation } from '../services/recommendation';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryConfig'>;

export function CategoryConfigScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const income = useBudgetStore((state) => state.income);
  const habits = useBudgetStore((state) => state.habits);
  const hasOnboarded = useBudgetStore((state) => state.hasOnboarded);
  const categories = useBudgetStore((state) => state.categories);
  const setCategoryPercentages = useBudgetStore((state) => state.setCategoryPercentages);
  const completeOnboarding = useBudgetStore((state) => state.completeOnboarding);

  const [isSaving, setIsSaving] = useState(false);

  const recommendation = useMemo(
    () =>
      recommendAllocation({
        income,
        currentEssentialSpend: habits.currentEssentialSpend ?? 0,
        currentLeisureSpend: habits.currentLeisureSpend ?? 0,
      }),
    [income, habits]
  );

  const isFirstTime = !hasOnboarded;
  const initialPercentages = isFirstTime
    ? {
        essentielles: recommendation.essential,
        loisirs: recommendation.leisure,
        investissement: recommendation.investment,
      }
    : undefined;

  const { drafts, updatePercentage, total, isValid, toUpdates } = useCategoryConfig(categories, initialPercentages);

  const handleValidate = async () => {
    setIsSaving(true);
    try {
      await setCategoryPercentages(db, toUpdates());
      if (isFirstTime) {
        await completeOnboarding(db);
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        navigation.goBack();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Votre répartition</Text>
      <Text style={styles.subtitle}>
        Ajustez les curseurs selon vos priorités. Le total doit toujours faire 100%.
      </Text>

      {isFirstTime && recommendation.message ? (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationText}>{recommendation.message}</Text>
        </View>
      ) : null}

      {categories.map((category) => (
        <CategorySlider
          key={category.id}
          label={category.label}
          color={category.color}
          value={drafts[category.id] ?? category.percentage}
          onValueChange={(value) => updatePercentage(category.id, value)}
        />
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={[styles.totalValue, !isValid && styles.totalInvalid]}>{Math.round(total)}%</Text>
      </View>

      <PrimaryButton
        title={isSaving ? 'Enregistrement...' : 'Valider'}
        onPress={handleValidate}
        disabled={!isValid || isSaving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  recommendationBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 14,
    marginBottom: 24,
  },
  recommendationText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  totalInvalid: {
    color: colors.danger,
  },
});
