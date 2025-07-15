import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const {id} = await params;
  await db.read();
  const tenant = db.data.tenants.find((t) => t.id === id);

  if (!tenant) {
    return new NextResponse('Tenant not found', { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { name, flatId } = await request.json();
  const {id} = await params;
  const db = await getDb();
  await db.read();

  const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

  if (tenantIndex === -1) {
    return new NextResponse('Tenant not found', { status: 404 });
  }

  db.data.tenants[tenantIndex] = { ...db.data.tenants[tenantIndex], name, flatId };
  await db.write();

  return NextResponse.json(db.data.tenants[tenantIndex]);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const {id} = await params;
  await db.read();

  const initialLength = db.data.tenants.length;
  db.data.tenants = db.data.tenants.filter((t) => t.id !== id);
  
  if (db.data.tenants.length === initialLength) {
    return new NextResponse('Tenant not found', { status: 404 });
  }

  await db.write();
  return new NextResponse(null, { status: 204 });
}