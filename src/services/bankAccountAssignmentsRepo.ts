import type { SQLiteDatabase } from 'expo-sqlite';

interface AssignmentRow {
  bridge_account_id: string;
  category_id: number;
}

export async function getAssignments(db: SQLiteDatabase): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<AssignmentRow>('SELECT bridge_account_id, category_id FROM bank_account_assignments');
  return Object.fromEntries(rows.map((row) => [row.bridge_account_id, row.category_id]));
}

export async function setAssignment(
  db: SQLiteDatabase,
  bridgeAccountId: string,
  categoryId: number | null
): Promise<void> {
  if (categoryId === null) {
    await db.runAsync('DELETE FROM bank_account_assignments WHERE bridge_account_id = $id', { $id: bridgeAccountId });
    return;
  }

  await db.runAsync(
    `INSERT INTO bank_account_assignments (bridge_account_id, category_id)
     VALUES ($id, $categoryId)
     ON CONFLICT(bridge_account_id) DO UPDATE SET category_id = $categoryId`,
    { $id: bridgeAccountId, $categoryId: categoryId }
  );
}
