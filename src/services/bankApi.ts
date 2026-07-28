import type { BankBalance } from '../types/bank';

export class BankApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!API_BASE) {
    throw new BankApiError("URL de l'API backend non configurée (EXPO_PUBLIC_API_BASE_URL).");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new BankApiError(body?.message ?? `Erreur serveur (HTTP ${response.status}).`);
  }

  return body as T;
}

export function createBridgeUser(): Promise<{ userUuid: string }> {
  return request('/api/bank/create-user', { method: 'POST' });
}

export function createConnectSession(
  userUuid: string,
  userEmail: string,
  callbackUrl: string
): Promise<{ connectUrl: string }> {
  return request('/api/bank/connect-session', {
    method: 'POST',
    body: JSON.stringify({ userUuid, userEmail, callbackUrl }),
  });
}

export function fetchBankBalance(userUuid: string): Promise<BankBalance> {
  return request(`/api/bank/balance?userUuid=${encodeURIComponent(userUuid)}`, { method: 'GET' });
}
