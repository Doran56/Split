import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  sql: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        gross_monthly_income REAL NOT NULL DEFAULT 0,
        current_essential_spend REAL,
        current_leisure_spend REAL,
        has_onboarded INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        percentage REAL NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS bank_account_assignments (
        bridge_account_id TEXT PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id)
      );
    `,
  },
];

const DEFAULT_CATEGORIES = [
  { key: 'essentielles', label: 'Dépenses essentielles', percentage: 50, color: '#2F6FED', sortOrder: 0 },
  { key: 'loisirs', label: 'Loisirs', percentage: 30, color: '#F5A623', sortOrder: 1 },
  { key: 'investissement', label: 'Investissement', percentage: 20, color: '#2FB380', sortOrder: 2 },
];

export async function initDb(db: SQLiteDatabase): Promise<void> {
  const { user_version: currentVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )) ?? { user_version: 0 };

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.execAsync(migration.sql);
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
  }

  await seedIfEmpty(db);
}

async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (existing && existing.count > 0) return;

  await db.withTransactionAsync(async () => {
    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (key, label, percentage, color, sort_order) VALUES ($key, $label, $percentage, $color, $sortOrder)',
        {
          $key: category.key,
          $label: category.label,
          $percentage: category.percentage,
          $color: category.color,
          $sortOrder: category.sortOrder,
        }
      );
    }

    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO settings (id, gross_monthly_income, has_onboarded, updated_at)
       VALUES (1, 0, 0, $updatedAt)
       ON CONFLICT(id) DO NOTHING`,
      { $updatedAt: now }
    );
  });
}
