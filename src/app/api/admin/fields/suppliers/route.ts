import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  await db.read();
  return NextResponse.json(db.data.supplierFields || []);
}

export async function POST(request: Request) {
  const { name, type } = await request.json();
  const db = await getDb();
  await db.read();

  if (!db.data.supplierFields) {
    db.data.supplierFields = [];
  }

  const newField = { id: Date.now().toString(), name, type };
  db.data.supplierFields.push(newField);
  await db.write();
  return NextResponse.json(newField);
}
