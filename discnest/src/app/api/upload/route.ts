"use server";

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getNSFWModel, tf } from "@/lib/nsfwModel";
import { fileTypeFromBuffer } from "file-type";
import { createCanvas, loadImage } from "canvas";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* ---------- Upload + NSFW Detection Handler ---------- */
const uploadImageHandler = async (req: Request, session: any) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const folder = formData.get("folder")?.toString() || "misc";   // ⭐ NEW

  if (!file)
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = await fileTypeFromBuffer(buffer);

  if (!type?.mime.startsWith("image/"))
    return NextResponse.json({ error: "Not an image" }, { status: 400 });

  // 🖼️ Canvas resizing for NSFW detection
  const img = await loadImage(buffer);
  const canvas = createCanvas(224, 224);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, 224, 224);

  const imageData = ctx.getImageData(0, 0, 224, 224);
  const imageTensor = tf.tidy(() => {
    const tensor4 = tf.tensor3d(new Uint8Array(imageData.data), [224, 224, 4]);
    return tf.slice(tensor4, [0, 0, 0], [-1, -1, 3]);
  });

  // 🔍 NSFW detection
  const model = await getNSFWModel();
  const predictions = await model.classify(imageTensor);
  imageTensor.dispose();

  const flaggedClasses = [
    "Porn", "Hentai", "Erotica", "Sexual activity", "Nude",
    "Sexy", "Lewd", "Suggestive", "Adult content",
    "Graphic violence", "Gore", "Self-harm", "Drug use"
  ];

  const flagged = predictions.some(
    (p) => flaggedClasses.includes(p.className) && p.probability > 0.6
  );

  // ☁️ Cloudinary Upload 
  const uploadResult: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder }, 
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

  return NextResponse.json({
    status: flagged ? "pendingReview" : "approved",
    imageUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    flagged,
  });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(uploadImageHandler),
  "/api/upload"
);
