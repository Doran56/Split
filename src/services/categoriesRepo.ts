import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, CategoryKey, CategoryPctUpdate } from '../types/budget';

interface CategoryRow {
  id: number;
  key: string;
  label: string;
  percentage: number;
  color: string;
  sort_order: number;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    key: row.key as CategoryKey,
    label: row.label,
    percentage: row.percentage,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

export async function getCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY sort_order ASC');
  return rows.map(toCategory);
}

export async function saveCategoryPercentages(db: SQLiteDatabase, updates: CategoryPctUpdate[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const update of updates) {
      await db.runAsync('UPDATE categories SET percentage = $percentage WHERE id = $id', {
        $percentage: update.percentage,
        $id: update.id,
      });
    }
  });
}
