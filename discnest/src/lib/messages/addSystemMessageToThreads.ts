import MessageThread from "@/models/MessageThread";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function addSystemMessageToThreads(listingId: string, text: string) {
  await connectToDatabase();

  // System messages use "null" sender to indicate non-user content
  const systemSender = new mongoose.Types.ObjectId("000000000000000000000000");

  // Find threads tied to this listing
  const threads = await MessageThread.find({ listingId });

  for (const thread of threads) {
    thread.messages.push({
      sender: systemSender,          // <-- Fake system sender ID
      content: text,
      timestamp: new Date(),
      readBy: [],                    // Nobody has read it yet
    });

    thread.updatedAt = new Date();
    await thread.save();
  }

  return threads.length;
}
