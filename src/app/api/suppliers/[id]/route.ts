import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.read();
    const supplier = db.data.suppliers.find((s) => s.id === id);
    if (supplier) {
      return NextResponse.json(supplier);
    } else {
      return new NextResponse('Supplier not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const data = await request.json();
    const db = await getDb();
    await db.read();
    const index = db.data.suppliers.findIndex((s) => s.id === id);
    if (index !== -1) {
      // Merge existing supplier data with new data, preserving contacts and notes if not explicitly updated
      db.data.suppliers[index] = {
        ...db.data.suppliers[index],
        ...data,
        communicationChannels: data.communicationChannels || db.data.suppliers[index].communicationChannels,
        supplierContacts: data.supplierContacts || db.data.suppliers[index].supplierContacts,
        supplierNotes: data.supplierNotes || db.data.suppliers[index].supplierNotes,
      };
      await db.write();
      return NextResponse.json(db.data.suppliers[index]);
    } else {
      return new NextResponse('Supplier not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error updating supplier:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.read();
    const index = db.data.suppliers.findIndex((s) => s.id === id);
    if (index !== -1) {
      const deletedSupplier = db.data.suppliers.splice(index, 1);
      await db.write();
      return NextResponse.json(deletedSupplier);
    } else {
      return new NextResponse('Supplier not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
