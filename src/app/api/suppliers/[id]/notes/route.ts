import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { note, date } = await request.json();
  const db = await getDb();
  await db.read();

  const supplierIndex = db.data.suppliers.findIndex((s) => s.id === id);

  if (supplierIndex === -1) {
    return new Response('Supplier not found', { status: 404 });
  }

  if (!db.data.suppliers[supplierIndex].supplierNotes) {
    db.data.suppliers[supplierIndex].supplierNotes = [];
  }
  const newNote = { id: Date.now().toString(), note, date };
  db.data.suppliers[supplierIndex].supplierNotes.push(newNote);
  await db.write();

  return NextResponse.json(newNote);
}
