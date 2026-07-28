import * as bankApi from '../../services/bankApi';
import * as secureStorage from '../../services/secureStorage';
import { useBudgetStore } from '../useBudgetStore';

jest.mock('../../services/bankApi');
jest.mock('../../services/secureStorage');

const mockedBankApi = bankApi as jest.Mocked<typeof bankApi>;
const mockedSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

const INITIAL_BANK_CONNECTION = {
  status: 'none' as const,
  balance: null,
  currency: null,
  updatedAt: null,
  errorMessage: null,
};

beforeEach(() => {
  jest.resetAllMocks();
  useBudgetStore.setState({ bankConnection: INITIAL_BANK_CONNECTION });
});

describe('useBudgetStore bank actions', () => {
  it('connectBankAccount creates a Bridge user when none is stored yet, then a connect session', async () => {
    mockedSecureStorage.getBankUserUuid.mockResolvedValue(null);
    mockedBankApi.createBridgeUser.mockResolvedValue({ userUuid: 'new-uuid' });
    mockedBankApi.createConnectSession.mockResolvedValue({ connectUrl: 'https://connect.example/session' });

    const result = await useBudgetStore.getState().connectBankAccount('user@example.com', 'split://bank-callback');

    expect(mockedBankApi.createBridgeUser).toHaveBeenCalledTimes(1);
    expect(mockedSecureStorage.setBankUserUuid).toHaveBeenCalledWith('new-uuid');
    expect(mockedBankApi.createConnectSession).toHaveBeenCalledWith(
      'new-uuid',
      'user@example.com',
      'split://bank-callback'
    );
    expect(result).toEqual({ connectUrl: 'https://connect.example/session' });
  });

  it('connectBankAccount reuses an existing stored userUuid without creating a new one', async () => {
    mockedSecureStorage.getBankUserUuid.mockResolvedValue('existing-uuid');
    mockedBankApi.createConnectSession.mockResolvedValue({ connectUrl: 'https://connect.example/session' });

    await useBudgetStore.getState().connectBankAccount('user@example.com', 'split://bank-callback');

    expect(mockedBankApi.createBridgeUser).not.toHaveBeenCalled();
    expect(mockedBankApi.createConnectSession).toHaveBeenCalledWith(
      'existing-uuid',
      'user@example.com',
      'split://bank-callback'
    );
  });

  it('connectBankAccount sets an error status and rethrows when the backend call fails', async () => {
    mockedSecureStorage.getBankUserUuid.mockResolvedValue('existing-uuid');
    mockedBankApi.createConnectSession.mockRejectedValue(new Error('Backend indisponible.'));

    await expect(
      useBudgetStore.getState().connectBankAccount('user@example.com', 'split://bank-callback')
    ).rejects.toThrow('Backend indisponible.');
    expect(useBudgetStore.getState().bankConnection.status).toBe('error');
    expect(useBudgetStore.getState().bankConnection.errorMessage).toBe('Backend indisponible.');
  });

  it('refreshBankBalance resets to "none" when no userUuid is stored', async () => {
    mockedSecureStorage.getBankUserUuid.mockResolvedValue(null);

    await useBudgetStore.getState().refreshBankBalance();

    expect(useBudgetStore.getState().bankConnection).toEqual(INITIAL_BANK_CONNECTION);
    expect(mockedBankApi.fetchBankBalance).not.toHaveBeenCalled();
  });

  it('refreshBankBalance populates balance fields on success', async () => {
    mockedSecureStorage.getBankUserUuid.mockResolvedValue('existing-uuid');
    mockedBankApi.fetchBankBalance.mockResolvedValue({
      balance: 1234.56,
      currency: 'EUR',
      updatedAt: '2026-07-27T10:00:00Z',
      accounts: [],
    });

    await useBudgetStore.getState().refreshBankBalance();

    expect(useBudgetStore.getState().bankConnection).toEqual({
      status: 'connected',
      balance: 1234.56,
      currency: 'EUR',
      updatedAt: '2026-07-27T10:00:00Z',
      errorMessage: null,
    });
  });

  it('refreshBankBalance keeps the last known balance visible and surfaces an error on failure', async () => {
    useBudgetStore.setState({
      bankConnection: {
        status: 'connected',
        balance: 1000,
        currency: 'EUR',
        updatedAt: '2026-07-20T10:00:00Z',
        errorMessage: null,
      },
    });
    mockedSecureStorage.getBankUserUuid.mockResolvedValue('existing-uuid');
    mockedBankApi.fetchBankBalance.mockRejectedValue(new Error('Réseau indisponible.'));

    await useBudgetStore.getState().refreshBankBalance();

    const state = useBudgetStore.getState().bankConnection;
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Réseau indisponible.');
    expect(state.balance).toBe(1000); // le dernier solde connu reste affiché
  });

  it('disconnectBankAccount clears the stored userUuid and resets bank connection state', async () => {
    useBudgetStore.setState({
      bankConnection: { status: 'connected', balance: 500, currency: 'EUR', updatedAt: 'x', errorMessage: null },
    });

    await useBudgetStore.getState().disconnectBankAccount();

    expect(mockedSecureStorage.clearBankUserUuid).toHaveBeenCalledTimes(1);
    expect(useBudgetStore.getState().bankConnection).toEqual(INITIAL_BANK_CONNECTION);
  });

  // Régression : ces trois actions appellent secureStorage avant tout try/catch — une plateforme
  // sans SecureStore fonctionnel (ex. web) ne doit jamais produire un rejet non intercepté.
  it('refreshBankBalance surfaces a storage failure as an error state instead of throwing', async () => {
    mockedSecureStorage.getBankUserUuid.mockRejectedValue(new Error('SecureStore indisponible.'));

    await expect(useBudgetStore.getState().refreshBankBalance()).resolves.toBeUndefined();

    expect(useBudgetStore.getState().bankConnection.status).toBe('error');
  });

  it('disconnectBankAccount resets state even when clearing storage fails', async () => {
    useBudgetStore.setState({
      bankConnection: { status: 'connected', balance: 500, currency: 'EUR', updatedAt: 'x', errorMessage: null },
    });
    mockedSecureStorage.clearBankUserUuid.mockRejectedValue(new Error('SecureStore indisponible.'));

    await expect(useBudgetStore.getState().disconnectBankAccount()).resolves.toBeUndefined();

    expect(useBudgetStore.getState().bankConnection).toEqual(INITIAL_BANK_CONNECTION);
  });
});
