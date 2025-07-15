import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.read();

    if (!db.data.tenantFields) {
      return new NextResponse('Field not found', { status: 404 });
    }

    const initialLength = db.data.tenantFields.length;
    db.data.tenantFields = db.data.tenantFields.filter((field) => field.id !== id);

    if (db.data.tenantFields.length < initialLength) {
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