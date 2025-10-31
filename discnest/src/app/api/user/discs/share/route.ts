import { withUserAuth } from '@/lib/auth/withUserAuth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

export const POST = withUserAuth(async (req, session) => {
  await connectToDatabase();

  const dbUser = await User.findById(session.user.id);
  if (!dbUser) {
    return new Response('User not found', { status: 404 });
  }

  // Toggle visibility or create new shareable ID
  if (dbUser.bagVisibility === 'public') {
    dbUser.bagVisibility = 'private';
  } else {
    if (!dbUser.shareableBagId) dbUser.shareableBagId = uuidv4();
    dbUser.bagVisibility = 'public';
  }

  await dbUser.save();

  return Response.json({
    bagVisibility: dbUser.bagVisibility,
    shareableBagId: dbUser.shareableBagId,
  });
});
