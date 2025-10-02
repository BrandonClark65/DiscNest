import { NextResponse } from 'next/server';
import { User, Disc } from '@/models';  // ✅ safe import
import { connectToDatabase } from '@/lib/mongodb';


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).populate('discShelf');

    if (!user) {
      return NextResponse.json({ shelf: [] }, { status: 200 }); // ✅ return empty array instead of error
    }

    return NextResponse.json({ shelf: user.discShelf || [] }, { status: 200 });
  } catch (err) {
    console.error('❌ Error in shelf route:', err);
    return NextResponse.json({ shelf: [] }, { status: 500 }); // ✅ always return JSON
  }
}