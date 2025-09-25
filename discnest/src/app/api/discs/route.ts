import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';

export async function GET() {
  try {
    await connectToDatabase();
    const discs = await Disc.find({});
    return NextResponse.json({ success: true, data: discs });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch discs' }, { status: 500 });
  }
}