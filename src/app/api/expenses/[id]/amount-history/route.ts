import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { amount, startDate, endDate } = await request.json();
    const db = await getDb();
    await db.read();

    const expenseIndex = db.data.expenses.findIndex((e) => e.id === id);

    if (expenseIndex === -1) {
      return new NextResponse('Expense not found', { status: 404 });
    }

    const newEntry = { id: Date.now().toString(), amount, startDate, endDate };
    db.data.expenses[expenseIndex].amountHistory.push(newEntry);
    await db.write();

    return NextResponse.json(newEntry);
  } catch (error) {
    console.error('Error adding amount history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}