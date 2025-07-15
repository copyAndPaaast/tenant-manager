import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { note, date } = await request.json();
  const db = await getDb();
  await db.read();

  const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

  if (tenantIndex === -1) {
    return new Response('Tenant not found', { status: 404 });
  }

  const newNote = { id: Date.now().toString(), note, date };
  db.data.tenants[tenantIndex].notes.push(newNote);
  await db.write();

  return NextResponse.json(newNote);
}
