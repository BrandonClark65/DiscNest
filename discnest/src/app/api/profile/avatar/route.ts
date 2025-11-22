import { NextResponse } from "next/server";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const handler = async (req: Request, session: any) => {
  await connectToDatabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // ---- Forward to existing upload route ----
  const baseUrl = new URL(req.url).origin;
  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: { cookie: req.headers.get("cookie") || "" },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadData.imageUrl)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });

  const userId = session.user.id;
  const user = await User.findById(userId);
    console.log("User found for avatar upload:", user);
    console.log("New avatar URL:", uploadData.publicId);
    console.log("User's current avatar public_id:", user?.avatarPublicId);
  // Delete previous avatar if exists
  if (user.avatarPublicId) {
    try {
        console.log("Deleting Cloudinary public_id:", user.avatarPublicId);
      await cloudinary.v2.uploader.destroy(user.avatarPublicId);
    } catch (err) {
      console.error("Error deleting old avatar:", err);
    }
  }
    console.log("New avatar URL:", uploadData.publicId);
  // Save new avatar
  user.avatarUrl = uploadData.imageUrl;
  user.avatarPublicId = uploadData.publicId;
  await user.save();
  const userAfterSave = await User.findById(userId);
  console.log("User updated with new avatar:", userAfterSave?.avatarPublicId);

  return NextResponse.json({
    success: true,
    avatarUrl: uploadData.imageUrl,
    status: uploadData.status,
    flagged: uploadData.flagged,
  });
};

export const POST = withErrorHandling(withUserAuth(handler), "/api/profile/avatar");
