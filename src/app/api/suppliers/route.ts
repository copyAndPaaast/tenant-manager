import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  await db.read();
  return NextResponse.json(db.data.suppliers);
}

export async function POST(request: Request) {
  const { name, address, customFields } = await request.json();
  const db = await getDb();
  await db.read();

  const newSupplier = {
    id: Date.now().toString(),
    name,
    address: address || '',
    communicationChannels: [],
    supplierContacts: [],
    supplierNotes: [],
    customFields: customFields || {},
  };

  db.data.suppliers.push(newSupplier);
  await db.write();
  return NextResponse.json(newSupplier);
}
