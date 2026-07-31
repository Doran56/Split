import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountInput } from '../components/AmountInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { incomeSchema } from '../services/validation';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingIncome'>;

export function OnboardingIncomeScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const storeIncome = useBudgetStore((state) => state.income);
  const setIncome = useBudgetStore((state) => state.setIncome);

  const [value, setValue] = useState(storeIncome > 0 ? String(storeIncome) : '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    const result = incomeSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Montant invalide.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await setIncome(db, result.data);
      navigation.navigate('OnboardingHabits');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.subtitle}>
            Pour vous proposer une répartition de budget adaptée, commençons par votre revenu mensuel brut.
          </Text>

          <AmountInput
            label="Revenu mensuel brut"
            value={value}
            onChangeText={setValue}
            placeholder="Ex : 2500"
            error={error}
          />
        </View>

        <PrimaryButton title={isSaving ? 'Enregistrement...' : 'Continuer'} onPress={handleContinue} disabled={isSaving} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
