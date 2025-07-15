import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface RouteParams { id: string; }

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const db = await getDb();
  const {id} = await params;
  await db.read();
  const flat = db.data.flats.find((f) => f.id === id);

  if (!flat) {
    return new NextResponse('Flat not found', { status: 404 });
  }

  return NextResponse.json(flat);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { params } = context;
  const { name, description, newNote } = await request.json();
  const {id} = await params;
  await db.read();

  const flatIndex = db.data.flats.findIndex((f) => f.id === id);

  if (flatIndex === -1) {
    return new NextResponse('Flat not found', { status: 404 });
  }

  const updatedFlat = { ...db.data.flats[flatIndex], name, description };
  if (newNote) {
    updatedFlat.notes.push({ id: Date.now().toString(), date: new Date().toISOString(), note: newNote });
  }

  db.data.flats[flatIndex] = updatedFlat;
  await db.write();

  return NextResponse.json(db.data.flats[flatIndex]);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const db = await getDb();
  const {id} = await params;
  await db.read();

  const initialLength = db.data.flats.length;
  db.data.flats = db.data.flats.filter((f) => f.id !== id);
  
  if (db.data.flats.length === initialLength) {
    return new NextResponse('Flat not found', { status: 404 });
  }

  await db.write();
  return new NextResponse(null, { status: 204 });
}
