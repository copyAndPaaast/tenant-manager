import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, contactId: string }> }
): Promise<NextResponse> {
  try {
    const { id, contactId } = await params;
    const db = await getDb();
    await db.read();

    const supplierIndex = db.data.suppliers.findIndex((s) => s.id === id);

    if (supplierIndex === -1) {
      return new NextResponse('Supplier not found', { status: 404 });
    }

    const initialLength = db.data.suppliers[supplierIndex].supplierContacts.length;
    db.data.suppliers[supplierIndex].supplierContacts = db.data.suppliers[supplierIndex].supplierContacts.filter((contact) => contact.id !== contactId);

    if (db.data.suppliers[supplierIndex].supplierContacts.length < initialLength) {
      await db.write();
      return new NextResponse(null, { status: 204 });
    } else {
      return new NextResponse('Contact not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
