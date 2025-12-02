export type FlaggedMessageUI = {
  _id: string;
  content: string;
  categories: Record<string, boolean>;
  status: "pending" | "delivered" | "resolved" | "rejected";
  createdAt: string;
  updatedAt: string;

  sender: {
    _id: string;
    name: string;
    email: string;
    moderationFlags: number;
  };

  threadId: {
    _id: string;
    listingId?: {
      _id: string;
      title: string;
    } | null;
  };
};
