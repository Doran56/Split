import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySlider } from '../components/CategorySlider';
import { PrimaryButton } from '../components/PrimaryButton';
import { useCategoryConfig } from '../hooks/useCategoryConfig';
import { recommendAllocation } from '../services/recommendation';
import { formatCurrencyEUR, roundToNearest } from '../services/locale';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryConfig'>;

function amountFor(income: number, percentage: number): string {
  if (income <= 0) return formatCurrencyEUR(0);
  return formatCurrencyEUR(roundToNearest((income * percentage) / 100, 10));
}

export function CategoryConfigScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const income = useBudgetStore((state) => state.income);
  const habits = useBudgetStore((state) => state.habits);
  const hasOnboarded = useBudgetStore((state) => state.hasOnboarded);
  const categories = useBudgetStore((state) => state.categories);
  const setCategoryPercentages = useBudgetStore((state) => state.setCategoryPercentages);
  const completeOnboarding = useBudgetStore((state) => state.completeOnboarding);

  const [isSaving, setIsSaving] = useState(false);

  const isFirstTime = !hasOnboarded;
  const canGoBack = !isFirstTime && navigation.canGoBack();

  const recommendation = useMemo(
    () =>
      recommendAllocation({
        income,
        currentEssentialSpend: habits.currentEssentialSpend ?? 0,
        currentLeisureSpend: habits.currentLeisureSpend ?? 0,
      }),
    [income, habits]
  );

  const recommendedByKey: Partial<Record<string, number>> = {
    essentielles: recommendation.essential,
    loisirs: recommendation.leisure,
    investissement: recommendation.investment,
  };

  const initialPercentages = isFirstTime ? recommendedByKey : undefined;

  const { drafts, updatePercentage, applyPreset, total, isValid, toUpdates } = useCategoryConfig(
    categories,
    initialPercentages
  );

  const handleApplyRecommendation = () => applyPreset(recommendedByKey);

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {canGoBack ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backLabel}>‹ Retour</Text>
          </Pressable>
        ) : null}

        <Text style={styles.title}>Votre répartition</Text>
        <Text style={styles.subtitle}>
          Ajustez les curseurs selon vos priorités. Le total doit toujours faire 100%.
        </Text>

        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>
            {isFirstTime ? 'Par défaut vs conseillée' : 'Actuelle vs conseillée'}
          </Text>
          {categories.map((category) => {
            const recommended = recommendedByKey[category.key] ?? category.percentage;
            return (
              <View key={category.id} style={styles.comparisonRow}>
                <View style={styles.comparisonLabelRow}>
                  <View style={[styles.swatch, { backgroundColor: category.color }]} />
                  <Text style={styles.comparisonLabel}>{category.label}</Text>
                </View>
                <Text style={styles.comparisonValue}>
                  {Math.round(category.percentage)}% → {Math.round(recommended)}%
                </Text>
              </View>
            );
          })}
          {recommendation.message ? <Text style={styles.recommendationText}>{recommendation.message}</Text> : null}
          <Pressable onPress={handleApplyRecommendation} style={styles.applyButton}>
            <Text style={styles.applyButtonLabel}>Appliquer la recommandation</Text>
          </Pressable>
        </View>

        {categories.map((category) => (
          <CategorySlider
            key={category.id}
            label={category.label}
            color={category.color}
            value={drafts[category.id] ?? category.percentage}
            onValueChange={(value) => updatePercentage(category.id, value)}
            amountLabel={amountFor(income, drafts[category.id] ?? category.percentage)}
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
    </SafeAreaView>
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
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
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
  comparisonBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 14,
    marginBottom: 24,
  },
  comparisonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  comparisonLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  comparisonLabel: {
    fontSize: 13,
    color: colors.text,
  },
  comparisonValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  recommendationText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 12,
  },
  applyButton: {
    alignSelf: 'flex-start',
  },
  applyButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
