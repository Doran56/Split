import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

interface AmountInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  suffix?: string;
}

/** Filtre en direct la saisie pour n'accepter que des nombres décimaux (virgule ou point). */
function sanitize(text: string): string {
  return text.replace(/[^\d.,]/g, '');
}

export function AmountInput({ label, value, onChangeText, placeholder, error, suffix = '€' }: AmountInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => onChangeText(sanitize(text))}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.text,
  },
  suffix: {
    fontSize: 16,
    color: colors.textMuted,
    marginLeft: 8,
  },
  error: {
    marginTop: 6,
    fontSize: 13,
    color: colors.danger,
  },
});
