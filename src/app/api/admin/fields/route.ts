import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  await db.read();
  return NextResponse.json(db.data.tenantFields || []);
}

export async function POST(request: Request) {
  const { name, type } = await request.json();
  const db = await getDb();
  await db.read();

  if (!db.data.tenantFields) {
    db.data.tenantFields = [];
  }

  const newField = { id: Date.now().toString(), name, type };
  db.data.tenantFields.push(newField);
  await db.write();
  return NextResponse.json(newField);
}
