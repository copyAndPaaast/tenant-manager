import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, agreementId:string  }> }) {
  const { id, agreementId } = await params;
  const db = await getDb();
  await db.read();

  const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

  if (tenantIndex === -1) {
    return new Response('Tenant not found', { status: 404 });
  }

  const initialLength = db.data.tenants[tenantIndex].rentAgreements.length;
  db.data.tenants[tenantIndex].rentAgreements = db.data.tenants[tenantIndex].rentAgreements.filter((agreement) => agreement.id !== agreementId);

  if (db.data.tenants[tenantIndex].rentAgreements.length < initialLength) {
    await db.write();
    return new Response(null, { status: 204 });
  } else {
    return new Response('Rent agreement not found', { status: 404 });
  }
}
