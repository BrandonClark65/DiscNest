import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Disc } from '@/models';
import type { Disc as DiscType } from '@/types/disc';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await getServerSession(authOptions);

  if (!session || session.user.email !== body.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { discId, plastic, wearLevel, notes, color } = body;
  if (!discId) {
    return NextResponse.json({ error: 'Missing disc ID' }, { status: 400 });
  }

  await connectToDatabase();

  const updateFields: Partial<DiscType> = {};

  if (plastic !== undefined) updateFields.plastic = plastic;

  if (wearLevel !== undefined) {
    const wearNumber = Number(wearLevel);
    if (isNaN(wearNumber) || wearNumber < 0 || wearNumber > 100) {
      return NextResponse.json({ error: 'wearLevel must be a number between 0 and 100' }, { status: 400 });
    }
    updateFields.wearLevel = wearNumber;
  }

  if (notes !== undefined) updateFields.notes = notes;
  if (color !== undefined) updateFields.color = color;

  try {
    const updatedDisc = await Disc.findByIdAndUpdate(discId, updateFields, { new: true });

    if (!updatedDisc) {
      return NextResponse.json({ error: 'Disc not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, disc: updatedDisc }, { status: 200 });
  } catch (err) {
    console.error('❌ Error updating disc:', err);
    return NextResponse.json({ error: 'Failed to update disc' }, { status: 500 });
  }
}


