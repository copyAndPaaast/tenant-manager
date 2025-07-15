import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, channelId: string }> }
): Promise<NextResponse> {
  try {
    const { id, channelId } = await params;
    const db = await getDb();
    await db.read();

    const supplierIndex = db.data.suppliers.findIndex((s) => s.id === id);

    if (supplierIndex === -1) {
      return new NextResponse('Supplier not found', { status: 404 });
    }

    const initialLength = db.data.suppliers[supplierIndex].communicationChannels.length;
    db.data.suppliers[supplierIndex].communicationChannels = db.data.suppliers[supplierIndex].communicationChannels.filter((channel) => channel.id !== channelId);

    if (db.data.suppliers[supplierIndex].communicationChannels.length < initialLength) {
      await db.write();
      return new NextResponse(null, { status: 204 });
    } else {
      return new NextResponse('Communication channel not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting communication channel:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}