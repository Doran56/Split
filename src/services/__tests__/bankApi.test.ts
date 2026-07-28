import { BankApiError, createBridgeUser, createConnectSession, fetchBankBalance } from '../bankApi';

const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const originalFetch = globalThis.fetch;

function mockFetchOnce(status: number, body: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://split-server.example.com';
});

afterEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('bankApi', () => {
  it('createBridgeUser posts to /api/bank/create-user and returns the userUuid', async () => {
    mockFetchOnce(200, { userUuid: 'abc-123' });
    const result = await createBridgeUser();
    expect(result).toEqual({ userUuid: 'abc-123' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://split-server.example.com/api/bank/create-user',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('createConnectSession sends userUuid, userEmail and callbackUrl and returns connectUrl', async () => {
    mockFetchOnce(200, { connectUrl: 'https://connect.bridgeapi.io/session/xyz' });
    const result = await createConnectSession('abc-123', 'user@example.com', 'split://bank-callback');
    expect(result).toEqual({ connectUrl: 'https://connect.bridgeapi.io/session/xyz' });
    const call = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toBe('https://split-server.example.com/api/bank/connect-session');
    expect(JSON.parse(call[1].body)).toEqual({
      userUuid: 'abc-123',
      userEmail: 'user@example.com',
      callbackUrl: 'split://bank-callback',
    });
  });

  it('fetchBankBalance builds the query string and returns the parsed balance', async () => {
    const balance = { balance: 1500.75, currency: 'EUR', updatedAt: null, accounts: [] };
    mockFetchOnce(200, balance);
    const result = await fetchBankBalance('abc-123');
    expect(result).toEqual(balance);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://split-server.example.com/api/bank/balance?userUuid=abc-123',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('throws a BankApiError with the server message on a non-2xx response', async () => {
    mockFetchOnce(400, { error: 'invalid_request', message: 'userUuid manquant.' });
    await expect(fetchBankBalance('')).rejects.toThrow(BankApiError);
    await expect(fetchBankBalance('')).rejects.toThrow('userUuid manquant.');
  });

  it('throws a clear BankApiError when the API base URL is not configured', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = '';
    await expect(createBridgeUser()).rejects.toThrow(BankApiError);
  });
});
