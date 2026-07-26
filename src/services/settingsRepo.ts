import type { SQLiteDatabase } from 'expo-sqlite';
import type { Settings } from '../types/budget';

interface SettingsRow {
  gross_monthly_income: number;
  current_essential_spend: number | null;
  current_leisure_spend: number | null;
  has_onboarded: number;
}

function toSettings(row: SettingsRow): Settings {
  return {
    income: row.gross_monthly_income,
    currentEssentialSpend: row.current_essential_spend,
    currentLeisureSpend: row.current_leisure_spend,
    hasOnboarded: row.has_onboarded === 1,
  };
}

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const row = await db.getFirstAsync<SettingsRow>(
    'SELECT gross_monthly_income, current_essential_spend, current_leisure_spend, has_onboarded FROM settings WHERE id = 1'
  );
  if (!row) {
    return { income: 0, currentEssentialSpend: null, currentLeisureSpend: null, hasOnboarded: false };
  }
  return toSettings(row);
}

export async function setIncome(db: SQLiteDatabase, income: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (id, gross_monthly_income, has_onboarded, updated_at)
     VALUES (1, $income, 0, $updatedAt)
     ON CONFLICT(id) DO UPDATE SET gross_monthly_income = $income, updated_at = $updatedAt`,
    { $income: income, $updatedAt: new Date().toISOString() }
  );
}

export async function setHabits(
  db: SQLiteDatabase,
  habits: { currentEssentialSpend: number; currentLeisureSpend: number }
): Promise<void> {
  await db.runAsync(
    `UPDATE settings SET current_essential_spend = $essential, current_leisure_spend = $leisure, updated_at = $updatedAt WHERE id = 1`,
    {
      $essential: habits.currentEssentialSpend,
      $leisure: habits.currentLeisureSpend,
      $updatedAt: new Date().toISOString(),
    }
  );
}

export async function setOnboarded(db: SQLiteDatabase, value: boolean): Promise<void> {
  await db.runAsync('UPDATE settings SET has_onboarded = $value, updated_at = $updatedAt WHERE id = 1', {
    $value: value ? 1 : 0,
    $updatedAt: new Date().toISOString(),
  });
}
