// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { withAdminAuth } from '@/lib/auth/withAdminAuth';

export const POST = withAdminAuth(async () => {
  // Spawn the seed script
  const seed = spawn(
    'npx',
    ['ts-node', '-P', 'tsconfig.seed.json', 'scripts/seed/seedDiscs.ts'],
    { stdio: 'inherit' } // automatically pipe stdout/stderr to console
  );

  // Listen for script exit
  seed.on('close', (code) => {
    console.log(`Seed script exited with code ${code}`);
  });

  return NextResponse.json({ message: 'Seeding started' });
});
