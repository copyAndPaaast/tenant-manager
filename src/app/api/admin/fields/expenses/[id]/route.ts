import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const db = await getDb();
    const {id} = await params;
    await db.read();

    if (!db.data.expenseFields) {
      return new NextResponse('Field not found', { status: 404 });
    }

    const initialLength = db.data.expenseFields.length;
    db.data.expenseFields = db.data.expenseFields.filter((field) => field.id !== id);

    if (db.data.expenseFields.length < initialLength) {
      await db.write();
      return new NextResponse(null, { status: 204 });
    } else {
      return new NextResponse('Field not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting field:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}