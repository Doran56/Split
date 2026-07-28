import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryPicker } from '../components/CategoryPicker';
import { EmptyState } from '../components/EmptyState';
import { formatCurrencyEUR } from '../services/locale';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AssignBankAccounts'>;

export function AssignBankAccountsScreen(_props: Props) {
  const db = useSQLiteContext();
  const accounts = useBudgetStore((state) => state.bankConnection.accounts);
  const categories = useBudgetStore((state) => state.categories);
  const bankAccountAssignments = useBudgetStore((state) => state.bankAccountAssignments);
  const assignBankAccount = useBudgetStore((state) => state.assignBankAccount);

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="Aucun compte connecté"
        description="Connectez d'abord votre banque depuis l'écran d'accueil pour pouvoir attribuer vos comptes à une catégorie."
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Attribuez chaque compte à une catégorie pour que son solde réel remplace le suivi manuel
        des dépenses de cette catégorie. Touchez à nouveau la catégorie sélectionnée pour
        retirer l'attribution.
      </Text>

      {accounts.map((account) => {
        const assignedCategoryId = bankAccountAssignments[account.id] ?? null;
        return (
          <View key={account.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountBalance}>
                {account.currency === 'EUR' ? formatCurrencyEUR(account.balance) : `${account.balance} ${account.currency}`}
              </Text>
            </View>
            <CategoryPicker
              categories={categories}
              selectedId={assignedCategoryId}
              onSelect={(categoryId) =>
                assignBankAccount(db, account.id, categoryId === assignedCategoryId ? null : categoryId)
              }
            />
          </View>
        );
      })}
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
  intro: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
