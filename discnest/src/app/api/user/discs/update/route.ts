import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Disc } from '@/models';
import type { Disc as DiscType } from '@/types/disc';
import { withUserAuth } from '@/lib/auth/withUserAuth';

export const POST = withUserAuth(async (req, session) => {
  const body = await req.json();

  const { discId, plastic, wearLevel, notes, color, weight } = body;
  if (!discId) {
    return NextResponse.json({ error: 'Missing disc ID' }, { status: 400 });
  }

  await connectToDatabase();

  // Ensure the user owns this disc
  const disc = await Disc.findById(discId);
  if (!disc || disc.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized or disc not found' }, { status: 401 });
  }

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

  if (weight !== undefined) {
    const parsedWeight = Number(weight);
    if (isNaN(parsedWeight) || parsedWeight < 100 || parsedWeight > 200) {
      return NextResponse.json({ error: 'Weight must be a valid number between 100–200g' }, { status: 400 });
    }
    updateFields.weight = parsedWeight;
  }

  try {
    const updatedDisc = await Disc.findByIdAndUpdate(discId, updateFields, { new: true });

    return NextResponse.json({ success: true, disc: updatedDisc }, { status: 200 });
  } catch (err) {
    console.error('❌ Error updating disc:', err);
    return NextResponse.json({ error: 'Failed to update disc' }, { status: 500 });
  }
});
