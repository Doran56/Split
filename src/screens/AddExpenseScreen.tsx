import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountInput } from '../components/AmountInput';
import { CategoryPicker } from '../components/CategoryPicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { expenseAmountSchema } from '../services/validation';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const dateLabelFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function AddExpenseScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const categories = useBudgetStore((state) => state.categories);
  const addExpense = useBudgetStore((state) => state.addExpense);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const amountResult = expenseAmountSchema.safeParse(amount);
    const nextErrors: { amount?: string; category?: string } = {};
    if (!amountResult.success) {
      nextErrors.amount = amountResult.error.issues[0]?.message ?? 'Montant invalide.';
    }
    if (categoryId === null) {
      nextErrors.category = 'Sélectionnez une catégorie.';
    }
    if (nextErrors.amount || nextErrors.category) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      await addExpense(db, {
        categoryId: categoryId as number,
        amount: amountResult.data as number,
        date: toIsoDate(date),
        note: note.trim() || null,
      });
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Nouvelle dépense</Text>

          <AmountInput label="Montant" value={amount} onChangeText={setAmount} placeholder="Ex : 25,50" error={errors.amount} />

          <Text style={styles.label}>Date</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{dateLabelFormatter.format(date)}</Text>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={(_event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDate(selectedDate);
              }}
            />
          ) : null}

          <Text style={styles.label}>Catégorie</Text>
          <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

          <Text style={styles.label}>Note (optionnel)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ex : Courses de la semaine"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <PrimaryButton title={isSaving ? 'Enregistrement...' : 'Ajouter'} onPress={handleSubmit} disabled={isSaving} />
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
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.danger,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
    marginBottom: 16,
  },
});
