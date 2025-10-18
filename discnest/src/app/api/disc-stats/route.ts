import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';
import { withAdminAuth } from '@/lib/auth/withAdminAuth';
import { UnauthorizedError } from '@/lib/errors/UnauthorizedError';

export const GET = withAdminAuth(async () => {
  try {
    await connectToDatabase();

    const stats = await Disc.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$addedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json(stats.map(s => ({ date: s._id, count: s.count })));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      console.warn('⛔ UnauthorizedError:', err.reason, err.context);
      return NextResponse.json(
        {
          error: err.message,
          reason: err.reason,
          context: err.context,
        },
        { status: 401 }
      );
    }

    console.error('❌ Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});