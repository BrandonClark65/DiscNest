// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST() {
  const seed = spawn('npx', ['ts-node', '-P', 'tsconfig.seed.json', 'scripts/seed/seedDiscs.ts']);

  seed.stdout.on('data', data => console.log(`stdout: ${data}`));
  seed.stderr.on('data', data => console.error(`stderr: ${data}`));

  seed.on('close', code => {
    console.log(`Seed script exited with code ${code}`);
  });

  return NextResponse.json({ message: 'Seeding started' });
}