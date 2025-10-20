import { NextResponse } from 'next/server';
import { User, Disc } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';
import { withUserAuth } from '@/lib/auth/withUserAuth';
import { recalcDiscCount } from '@/lib/updateDiscCount';

export const POST = withUserAuth(async (req, session) => {
  const { discId, target } = await req.json();

  if (!discId || !target || !['shelf', 'bag'].includes(target)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  await connectToDatabase();

  // Ensure the disc exists in catalog (without a user)
  const catalogDisc = await Disc.findOne({ _id: discId, userId: { $exists: false } });
  if (!catalogDisc) {
    return NextResponse.json({ error: 'Disc not found in catalog' }, { status: 404 });
  }

  // Clone the disc for the logged-in user
  const discData = catalogDisc.toObject();

  // 🩹 Ensure plastic is valid
  if (!discData.plastic || discData.plastic.trim() === '') {
    discData.plastic = 'Unknown';
  }

  const userDisc = new Disc({
    ...discData,
    _id: undefined, // Let MongoDB assign a new ID
    userId: session.user.id,
    addedAt: new Date(),
  });

  await userDisc.save();

  // Add to user's shelf or bag
  const updateField = target === 'shelf' ? 'discShelf' : 'bag';
  await User.updateOne(
    { _id: session.user.id },
    { $addToSet: { [updateField]: userDisc._id } }
  );

  // ✅ Update discCount after modification
  await recalcDiscCount(session.user.id);

  return NextResponse.json({ success: true, discId: userDisc._id });
});
