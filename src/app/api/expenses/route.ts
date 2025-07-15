import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  await db.read();
  return NextResponse.json(db.data.expenses);
}

export async function POST(request: Request) {
  const { description, amount, recurring, recurringDate, paymentMethod, supplierId, customFields } = await request.json();
  const db = await getDb();
  await db.read();

  const newExpense = {
    id: Date.now().toString(),
    description,
    amountHistory: [{ id: Date.now().toString(), amount, startDate: new Date().toISOString() }],
    recurring,
    recurringDate,
    paymentMethod,
    supplierId,
    customFields: customFields || {},
  };

  db.data.expenses.push(newExpense);
  await db.write();
  return NextResponse.json(newExpense);
}
