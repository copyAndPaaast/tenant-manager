import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, noteId:string  }> }
): Promise<NextResponse> {
  try {
    const { id, noteId } = await params;
    const db = await getDb();
    await db.read();

    const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

    if (tenantIndex === -1) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    const initialLength = db.data.tenants[tenantIndex].notes.length;
    db.data.tenants[tenantIndex].notes = db.data.tenants[tenantIndex].notes.filter((note) => note.id !== noteId);

    if (db.data.tenants[tenantIndex].notes.length < initialLength) {
      await db.write();
      return new NextResponse(null, { status: 204 });
    } else {
      return new NextResponse('Note not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
