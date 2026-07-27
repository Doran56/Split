import * as SecureStore from 'expo-secure-store';

const BANK_USER_UUID_KEY = 'bank_user_uuid';

export async function getBankUserUuid(): Promise<string | null> {
  return SecureStore.getItemAsync(BANK_USER_UUID_KEY);
}

export async function setBankUserUuid(userUuid: string): Promise<void> {
  await SecureStore.setItemAsync(BANK_USER_UUID_KEY, userUuid);
}

export async function clearBankUserUuid(): Promise<void> {
  await SecureStore.deleteItemAsync(BANK_USER_UUID_KEY);
}
