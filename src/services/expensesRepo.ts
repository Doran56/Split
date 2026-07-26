import type { SQLiteDatabase } from 'expo-sqlite';
import type { Expense, NewExpenseInput } from '../types/budget';

interface ExpenseRow {
  id: number;
  category_id: number;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function addExpense(db: SQLiteDatabase, input: NewExpenseInput): Promise<Expense> {
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO expenses (category_id, amount, date, note, created_at) VALUES ($categoryId, $amount, $date, $note, $createdAt)',
    {
      $categoryId: input.categoryId,
      $amount: input.amount,
      $date: input.date,
      $note: input.note ?? null,
      $createdAt: createdAt,
    }
  );
  return {
    id: result.lastInsertRowId,
    categoryId: input.categoryId,
    amount: input.amount,
    date: input.date,
    note: input.note ?? null,
    createdAt,
  };
}

export async function getExpensesForMonth(db: SQLiteDatabase, year: number, month: number): Promise<Expense[]> {
  const monthStr = String(month).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE date BETWEEN $start AND $end ORDER BY date DESC, id DESC',
    { $start: start, $end: end }
  );
  return rows.map(toExpense);
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = $id', { $id: id });
}
