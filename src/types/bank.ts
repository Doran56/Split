export interface BankAccountSummary {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface BankBalance {
  balance: number;
  currency: string;
  updatedAt: string | null;
  accounts: BankAccountSummary[];
}

export type BankConnectionStatus = 'none' | 'connecting' | 'connected' | 'error';

export interface BankConnectionState {
  status: BankConnectionStatus;
  balance: number | null;
  currency: string | null;
  updatedAt: string | null;
  errorMessage: string | null;
  accounts: BankAccountSummary[];
}
