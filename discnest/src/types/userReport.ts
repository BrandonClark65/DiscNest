export type UserReportUI = {
  _id: string;
  reporter: { _id: string; name: string; email: string };
  reportedUser: { _id: string; name: string; email: string };
  listingId?: { _id: string; title: string } | null;
  threadId?: { _id: string } | null;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
};
