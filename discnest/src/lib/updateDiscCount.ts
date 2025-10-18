import { User } from '@/models';

export const recalcDiscCount = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) return;

  const bagCount = Array.isArray(user.bag) ? user.bag.length : 0;
  const shelfCount = Array.isArray(user.discShelf) ? user.discShelf.length : 0;

  user.discCount = bagCount + shelfCount;
  await user.save();
};
