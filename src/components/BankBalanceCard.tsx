import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrencyEUR } from '../services/locale';
import { useBudgetStore } from '../store/useBudgetStore';
import { colors } from '../theme/colors';

const updatedAtFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function BankBalanceCard() {
  const bankConnection = useBudgetStore((state) => state.bankConnection);
  const connectBankAccount = useBudgetStore((state) => state.connectBankAccount);
  const refreshBankBalance = useBudgetStore((state) => state.refreshBankBalance);
  const disconnectBankAccount = useBudgetStore((state) => state.disconnectBankAccount);
  const [isOpeningBank, setIsOpeningBank] = useState(false);

  const handleConnect = async () => {
    setIsOpeningBank(true);
    try {
      const callbackUrl = Linking.createURL('bank-callback');
      const { connectUrl } = await connectBankAccount(callbackUrl);
      await WebBrowser.openAuthSessionAsync(connectUrl, callbackUrl);
      await refreshBankBalance();
    } catch {
      // L'erreur est déjà reflétée dans bankConnection.errorMessage par le store.
    } finally {
      setIsOpeningBank(false);
    }
  };

  if (bankConnection.status === 'none') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Compte bancaire</Text>
        <Text style={styles.description}>Connectez votre banque pour afficher votre solde réel ici.</Text>
        <Pressable style={styles.connectButton} onPress={handleConnect} disabled={isOpeningBank}>
          {isOpeningBank ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.connectButtonLabel}>Connecter ma banque</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Solde bancaire</Text>
        <Pressable onPress={() => refreshBankBalance()} disabled={bankConnection.status === 'connecting'}>
          {bankConnection.status === 'connecting' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.refreshLabel}>Rafraîchir</Text>
          )}
        </Pressable>
      </View>

      {bankConnection.balance !== null ? (
        <Text style={styles.balance}>{formatCurrencyEUR(bankConnection.balance)}</Text>
      ) : (
        <Text style={styles.balance}>—</Text>
      )}

      {bankConnection.updatedAt ? (
        <Text style={styles.updatedAt}>Mis à jour le {updatedAtFormatter.format(new Date(bankConnection.updatedAt))}</Text>
      ) : null}

      {bankConnection.status === 'error' && bankConnection.errorMessage ? (
        <Text style={styles.error}>{bankConnection.errorMessage}</Text>
      ) : null}

      <Pressable onPress={() => disconnectBankAccount()}>
        <Text style={styles.disconnect}>Déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  refreshLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  balance: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  updatedAt: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 8,
  },
  disconnect: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  connectButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
