import { aggregateBalance, type BridgeAccount } from '../bridge';

function account(overrides: Partial<BridgeAccount>): BridgeAccount {
  return {
    id: 1,
    name: 'Compte courant',
    balance: 0,
    currencyCode: 'EUR',
    updatedAt: null,
    ...overrides,
  };
}

describe('aggregateBalance', () => {
  it('returns a zero balance for no accounts', () => {
    expect(aggregateBalance([])).toEqual({ balance: 0, currency: 'EUR', updatedAt: null, accounts: [] });
  });

  it('sums balances across accounts sharing the same currency', () => {
    const result = aggregateBalance([
      account({ id: 1, balance: 1200.5, currencyCode: 'EUR' }),
      account({ id: 2, balance: 300.25, currencyCode: 'EUR' }),
    ]);
    expect(result.balance).toBe(1500.75);
    expect(result.currency).toBe('EUR');
    expect(result.accounts).toHaveLength(2);
  });

  it('excludes accounts in a different currency from the summed total but still lists them', () => {
    const result = aggregateBalance([
      account({ id: 1, balance: 1000, currencyCode: 'EUR' }),
      account({ id: 2, balance: 500, currencyCode: 'USD' }),
    ]);
    expect(result.balance).toBe(1000);
    expect(result.currency).toBe('EUR');
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts.find((a) => a.currency === 'USD')?.balance).toBe(500);
  });

  it('avoids floating point drift when summing many small balances', () => {
    const result = aggregateBalance([
      account({ id: 1, balance: 0.1 }),
      account({ id: 2, balance: 0.2 }),
    ]);
    expect(result.balance).toBe(0.3);
  });

  it('picks the most recent updatedAt across accounts', () => {
    const result = aggregateBalance([
      account({ id: 1, updatedAt: '2026-07-01T10:00:00Z' }),
      account({ id: 2, updatedAt: '2026-07-15T08:00:00Z' }),
      account({ id: 3, updatedAt: null }),
    ]);
    expect(result.updatedAt).toBe('2026-07-15T08:00:00Z');
  });
});
