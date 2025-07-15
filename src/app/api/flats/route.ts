import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  await db.read();
  return NextResponse.json(db.data.flats);
}

export async function POST(request: Request) {
  const { name, description, notes } = await request.json();
  const db = await getDb();
  await db.read();

  const newFlat = {
    id: Date.now().toString(),
    name,
    description: description || '',
    notes: [],
  };

  db.data.flats.push(newFlat);
  await db.write();
  return NextResponse.json(newFlat);
}
