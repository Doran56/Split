import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { AmountInput } from '../components/AmountInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { habitsSchema } from '../services/validation';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingHabits'>;

export function OnboardingHabitsScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const income = useBudgetStore((state) => state.income);
  const habits = useBudgetStore((state) => state.habits);
  const setHabits = useBudgetStore((state) => state.setHabits);

  const [essential, setEssential] = useState(
    habits.currentEssentialSpend != null ? String(habits.currentEssentialSpend) : ''
  );
  const [leisure, setLeisure] = useState(
    habits.currentLeisureSpend != null ? String(habits.currentLeisureSpend) : ''
  );
  const [errors, setErrors] = useState<{ essential?: string; leisure?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    const result = habitsSchema(income).safeParse({
      currentEssentialSpend: essential,
      currentLeisureSpend: leisure,
    });

    if (!result.success) {
      const next: { essential?: string; leisure?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'currentEssentialSpend') next.essential = issue.message;
        if (issue.path[0] === 'currentLeisureSpend') next.leisure = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      await setHabits(db, result.data);
      navigation.navigate('CategoryConfig');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Vos habitudes</Text>
        <Text style={styles.subtitle}>
          Pour vous suggérer une répartition qui augmente votre taux d'investissement, dites-nous en moyenne
          combien vous dépensez chaque mois.
        </Text>

        <AmountInput
          label="Dépenses essentielles / charges fixes"
          value={essential}
          onChangeText={setEssential}
          placeholder="Ex : 1000"
          error={errors.essential}
        />
        <AmountInput
          label="Dépenses loisirs"
          value={leisure}
          onChangeText={setLeisure}
          placeholder="Ex : 400"
          error={errors.leisure}
        />
      </View>

      <PrimaryButton title={isSaving ? 'Enregistrement...' : 'Continuer'} onPress={handleContinue} disabled={isSaving} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 32,
    lineHeight: 21,
  },
});
