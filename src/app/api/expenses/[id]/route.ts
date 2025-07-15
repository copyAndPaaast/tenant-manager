import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.read();
    const expense = db.data.expenses.find((e) => e.id === id);
    if (expense) {
      return NextResponse.json(expense);
    } else {
      return new NextResponse('Expense not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching expense:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { description, newAmount, recurring, recurringDate, paymentMethod, supplierId, customFields } = await request.json();
    const db = await getDb();
    await db.read();
    const index = db.data.expenses.findIndex((e) => e.id === id);
    if (index !== -1) {
      const existingExpense = db.data.expenses[index];
      const updatedExpense = {
        ...existingExpense,
        description: description !== undefined ? description : existingExpense.description,
        recurring: recurring !== undefined ? recurring : existingExpense.recurring,
        recurringDate: recurringDate !== undefined ? recurringDate : existingExpense.recurringDate,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existingExpense.paymentMethod,
        supplierId: supplierId !== undefined ? supplierId : existingExpense.supplierId,
        customFields: customFields !== undefined ? customFields : existingExpense.customFields,
      };

      if (newAmount !== undefined) {
        updatedExpense.amountHistory.push({ id: Date.now().toString(), amount: newAmount, startDate: new Date().toISOString() });
      }

      db.data.expenses[index] = updatedExpense;
      await db.write();
      return NextResponse.json(db.data.expenses[index]);
    } else {
      return new NextResponse('Expense not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error updating expense:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.read();
    const index = db.data.expenses.findIndex((e) => e.id === id);
    if (index !== -1) {
      const deletedExpense = db.data.expenses.splice(index, 1);
      await db.write();
      return NextResponse.json(deletedExpense);
    } else {
      return new NextResponse('Expense not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
