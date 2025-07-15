import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  await db.read();
  return NextResponse.json(db.data.tenants);
}

export async function POST(request: Request) {
  const { name, flatId } = await request.json();
  const db = await getDb();
  await db.read();

  const newTenant = {
    id: Date.now().toString(),
    name,
    flatId,
    monthlyPayHistory: [],
    notes: [],
    rentAgreements: [],
  };

  db.data.tenants.push(newTenant);
  await db.write();
  return NextResponse.json(newTenant);
}
