import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, phone, email, role } = await request.json();
  const db = await getDb();
  await db.read();

  const supplierIndex = db.data.suppliers.findIndex((s) => s.id === id);

  if (supplierIndex === -1) {
    return new Response('Supplier not found', { status: 404 });
  }

  const newContact = { id: Date.now().toString(), name, phone, email, role };
  db.data.suppliers[supplierIndex].supplierContacts.push(newContact);
  await db.write();

  return NextResponse.json(newContact);
}
