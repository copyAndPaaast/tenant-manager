import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, notelId: string }> }
): Promise<NextResponse> {
  try {
    const { id, notelId } = await params;
    const db = await getDb();
    await db.read();

    const supplierIndex = db.data.suppliers.findIndex((s) => s.id === id);

    if (supplierIndex === -1) {
      return new NextResponse('Supplier not found', { status: 404 });
    }

    const initialLength = db.data.suppliers[supplierIndex].supplierNotes.length;
    db.data.suppliers[supplierIndex].supplierNotes = db.data.suppliers[supplierIndex].supplierNotes.filter((note) => note.id !== notelId);

    if (db.data.suppliers[supplierIndex].supplierNotes.length < initialLength) {
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
