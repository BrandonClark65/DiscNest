import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';

export async function GET() {
  try {
    await connectToDatabase();

    // Only return catalog discs (not user-owned)
    const discs = await Disc.find(
      { userId: { $exists: false } },
      'name brand type addedAt image stability flight'
    ).sort({ addedAt: -1 }).lean();

    return NextResponse.json(discs);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch discs' }, { status: 500 });
  }
}