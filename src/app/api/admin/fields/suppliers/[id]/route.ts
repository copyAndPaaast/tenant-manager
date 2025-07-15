import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  await db.read();

  if (!db.data.supplierFields) {
    return new Response('Field not found', { status: 404 });
  }

  const initialLength = db.data.supplierFields.length;
  db.data.supplierFields = db.data.supplierFields.filter((field) => field.id !== id);

  if (db.data.supplierFields.length < initialLength) {
    await db.write();
    return new Response(null, { status: 204 });
  } else {
    return new Response('Field not found', { status: 404 });
  }
}