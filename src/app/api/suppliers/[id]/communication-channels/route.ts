import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { type, value } = await request.json();
  const db = await getDb();
  await db.read();

  const supplierIndex = db.data.suppliers.findIndex((s) => s.id === id);

  if (supplierIndex === -1) {
    return new Response('Supplier not found', { status: 404 });
  }

  if (!db.data.suppliers[supplierIndex].communicationChannels) {
    db.data.suppliers[supplierIndex].communicationChannels = [];
  }
  const newChannel = { id: Date.now().toString(), type, value };
  db.data.suppliers[supplierIndex].communicationChannels.push(newChannel);
  await db.write();

  return NextResponse.json(newChannel);
}
