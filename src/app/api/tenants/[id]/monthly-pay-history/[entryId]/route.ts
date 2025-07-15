import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, entryId:string  }> }
): Promise<NextResponse> {
  try {
    const { id, entryId } = await params;
    const db = await getDb();
    await db.read();

    const tenantIndex = db.data.tenants.findIndex((t) => t.id === id);

    if (tenantIndex === -1) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    if (!db.data.tenants[tenantIndex].monthlyPayHistory) {
      db.data.tenants[tenantIndex].monthlyPayHistory = [];
    }
    const initialLength = db.data.tenants[tenantIndex].monthlyPayHistory.length;
    db.data.tenants[tenantIndex].monthlyPayHistory = db.data.tenants[tenantIndex].monthlyPayHistory.filter((entry) => entry.id !== entryId);

    if (db.data.tenants[tenantIndex].monthlyPayHistory.length < initialLength) {
      await db.write();
      return new NextResponse(null, { status: 204 });
    } else {
      return new NextResponse('Monthly pay entry not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting monthly pay entry:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
