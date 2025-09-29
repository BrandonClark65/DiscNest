// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  const seed = spawn('npx', ['ts-node', '-P', 'tsconfig.seed.json', 'scripts/seed/seedDiscs.ts']);

  seed.stdout.on('data', data => console.log(`stdout: ${data}`));
  seed.stderr.on('data', data => console.error(`stderr: ${data}`));

  seed.on('close', code => {
    console.log(`Seed script exited with code ${code}`);
  });

  return NextResponse.json({ message: 'Seeding started' });
}