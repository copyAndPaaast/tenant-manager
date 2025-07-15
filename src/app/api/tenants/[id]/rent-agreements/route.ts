import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rent, startDate, endDate } = await request.json();
  const db = await getDb();
  await db.read();

  const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

  if (tenantIndex === -1) {
    return new Response('Tenant not found', { status: 404 });
  }

  const newAgreement = { id: Date.now().toString(), rent, startDate, endDate };
  db.data.tenants[tenantIndex].rentAgreements.push(newAgreement);
  await db.write();

  return NextResponse.json(newAgreement);
}
