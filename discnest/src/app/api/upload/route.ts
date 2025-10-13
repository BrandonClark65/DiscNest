'use server';

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getNSFWModel, tf } from '@/lib/nsfwModel';
import { fileTypeFromBuffer } from 'file-type';
import { createCanvas, loadImage } from 'canvas';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file)
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = await fileTypeFromBuffer(buffer);

    if (!type?.mime.startsWith('image/'))
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });

    // 🖼 Load image & draw to canvas
    const img = await loadImage(buffer);
    const canvas = createCanvas(224, 224);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 224, 224);

    const imageData = ctx.getImageData(0, 0, 224, 224);
    const imageTensor = tf.tidy(() => {
      const tensor4 = tf.tensor3d(new Uint8Array(imageData.data), [224, 224, 4]);
      return tf.slice(tensor4, [0, 0, 0], [-1, -1, 3]);
    });

    // 🔍 NSFW check (singleton model)
    const model = await getNSFWModel();
    const predictions = await model.classify(imageTensor);
    imageTensor.dispose();

    const flagged = predictions.some(
      (p) =>
        ['Porn', 'Sexy', 'Hentai'].includes(p.className) &&
        p.probability > 0.6
    );

    // ☁️ Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'disc-listings' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      status: flagged ? 'pendingReview' : 'approved',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      flagged,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
