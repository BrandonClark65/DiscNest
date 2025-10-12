'use server';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs-node';
import { fileTypeFromBuffer } from 'file-type';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const config = { api: { bodyParser: false } };

let nsfwModel: nsfwjs.NSFWJS | null = null;
async function loadNSFWModel() {
  if (!nsfwModel) nsfwModel = await nsfwjs.load();
  return nsfwModel;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = await fileTypeFromBuffer(buffer);
    if (!type?.mime.startsWith('image/')) return NextResponse.json({ error: 'Not an image' }, { status: 400 });

    // NSFW check
    const model = await loadNSFWModel();
    // Decode and convert to 3D tensor
    const imageTensor: tf.Tensor3D = tf.tidy(() => {
    const decoded = tf.node.decodeImage(buffer, 3); // Tensor3D | Tensor4D
    if (decoded.rank === 4) {
        return decoded.squeeze([0]) as tf.Tensor3D; // Force 3D
    }
    return decoded as tf.Tensor3D;
    });

    const predictions = await model.classify(imageTensor);
    imageTensor.dispose();

    const flagged = predictions.some(
      (p) => ['Porn', 'Sexy', 'Hentai'].includes(p.className) && p.probability > 0.6
    );

    // Upload to Cloudinary
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
