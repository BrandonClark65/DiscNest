import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

const handler = (NextAuth as unknown as (options: typeof authOptions) => {
  (req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }): Promise<Response>;
})(authOptions);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handler(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handler(req, context);
}