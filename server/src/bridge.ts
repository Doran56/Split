import { round2 } from './util';

export class BridgeConfigError extends Error {}
export class BridgeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

interface BridgeConfig {
  clientId: string;
  clientSecret: string;
  version: string;
  apiBase: string;
}

/**
 * Bridge's exact request/response schema below is reconstructed from search-indexed doc
 * snippets (docs.bridgeapi.io returned 403 to our fetch tooling) — verify field names
 * against the live dashboard API reference before shipping to production.
 */
export function getBridgeConfig(): BridgeConfig {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;
  const version = process.env.BRIDGE_VERSION;
  const apiBase = process.env.BRIDGE_API_BASE ?? 'https://api.bridgeapi.io';

  if (!clientId || !clientSecret || !version) {
    throw new BridgeConfigError(
      'Variables BRIDGE_CLIENT_ID / BRIDGE_CLIENT_SECRET / BRIDGE_VERSION manquantes.'
    );
  }

  return { clientId, clientSecret, version, apiBase };
}

async function bridgeFetch(config: BridgeConfig, path: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': config.clientId,
      'Client-Secret': config.clientSecret,
      'Bridge-Version': config.version,
      ...init.headers,
    },
  });

  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = body?.message ?? body?.error ?? `Erreur Bridge (HTTP ${response.status}).`;
    throw new BridgeApiError(message, response.status);
  }

  return body;
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export interface AccessToken {
  accessToken: string;
  expiresAt: string | null;
}

/**
 * Mints (and implicitly creates, if it doesn't already exist) a Bridge access token
 * scoped to the given user UUID. Bridge's token endpoint doubles as user creation on
 * first call for a given user_uuid, per available documentation snippets.
 */
export async function mintAccessToken(config: BridgeConfig, userUuid: string): Promise<AccessToken> {
  const body = await bridgeFetch(config, '/v3/aggregation/authorization/token', {
    method: 'POST',
    body: JSON.stringify({ user_uuid: userUuid }),
  });

  const accessToken = body?.access_token;
  if (!accessToken) {
    throw new BridgeApiError('Réponse Bridge inattendue : access_token manquant.', 502);
  }

  return { accessToken, expiresAt: body?.expires_at ?? null };
}

export async function createConnectSession(
  config: BridgeConfig,
  accessToken: string,
  callbackUrl: string
): Promise<{ connectUrl: string }> {
  const body = await bridgeFetch(config, '/v3/aggregation/connect-sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ callback_url: callbackUrl }),
  });

  const connectUrl = body?.url ?? body?.redirect_url ?? body?.connect_url;
  if (!connectUrl) {
    throw new BridgeApiError('Réponse Bridge inattendue : URL de connexion manquante.', 502);
  }

  return { connectUrl };
}

export interface BridgeAccount {
  id: string | number;
  name: string;
  balance: number;
  currencyCode: string;
  updatedAt: string | null;
}

export async function getAccounts(config: BridgeConfig, accessToken: string): Promise<BridgeAccount[]> {
  const body = await bridgeFetch(config, '/v3/aggregation/accounts', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const rawAccounts: any[] = Array.isArray(body) ? body : body?.resources ?? [];

  return rawAccounts.map((account) => ({
    id: account.id,
    name: account.name ?? 'Compte',
    balance: typeof account.balance === 'number' ? account.balance : 0,
    currencyCode: account.currency_code ?? 'EUR',
    updatedAt: account.updated_at ?? null,
  }));
}

export interface AggregatedBalance {
  balance: number;
  currency: string;
  updatedAt: string | null;
  accounts: { id: string; name: string; balance: number; currency: string }[];
}

/**
 * Sums balances for accounts sharing the dominant currency (the first account's currency).
 * Accounts in a different currency are still listed individually but excluded from the
 * summed total, since summing mixed currencies would be meaningless.
 */
export function aggregateBalance(accounts: BridgeAccount[]): AggregatedBalance {
  if (accounts.length === 0) {
    return { balance: 0, currency: 'EUR', updatedAt: null, accounts: [] };
  }

  const currency = accounts[0].currencyCode;
  const sameCurrency = accounts.filter((a) => a.currencyCode === currency);
  const balance = round2(sameCurrency.reduce((sum, a) => sum + a.balance, 0));
  const updatedAt = accounts
    .map((a) => a.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return {
    balance,
    currency,
    updatedAt,
    accounts: accounts.map((a) => ({ id: String(a.id), name: a.name, balance: a.balance, currency: a.currencyCode })),
  };
}
