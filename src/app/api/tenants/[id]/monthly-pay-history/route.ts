import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rent, heatingCost, additionalCost, startDate, endDate } = await request.json();
  const db = await getDb();
  await db.read();

  const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

  if (tenantIndex === -1) {
    return new Response('Tenant not found', { status: 404 });
  }

  if (!db.data.tenants[tenantIndex].monthlyPayHistory) {
    db.data.tenants[tenantIndex].monthlyPayHistory = [];
  }
  const newEntry = { id: Date.now().toString(), rent, heatingCost, additionalCost, startDate, endDate };
  db.data.tenants[tenantIndex].monthlyPayHistory.push(newEntry);
  await db.write();

  return NextResponse.json(newEntry);
}
