import DiscCard from '@/components/DiscCard';
import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';

export default async function DashboardPage() {
  await connectToDatabase();
  const discs = await Disc.find({ userId: 'YOUR_USER_ID' }); // Replace with session logic

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Disc Bag</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {discs.map((disc: any) => (
          <DiscCard key={disc._id} disc={disc} />
        ))}
      </div>
    </main>
  );
}