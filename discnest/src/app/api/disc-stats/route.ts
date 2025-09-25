// src/app/api/disc-stats/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';

export async function GET() {
  await connectToDatabase();

  const stats = await Disc.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$addedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json(stats.map(s => ({ date: s._id, count: s.count })));
}