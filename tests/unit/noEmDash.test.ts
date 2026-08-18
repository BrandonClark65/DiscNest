import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * Project rule: no em dashes anywhere in the source or docs.
 *
 * The em dash reads as an "AI wrote this" tell and is banned across the repo.
 * This test walks the tracked source and documentation and fails listing any
 * file that contains one, so the rule cannot quietly erode.
 *
 * The character is referenced by code point, never as a literal, so this file
 * does not flag itself.
 */
const EM_DASH = String.fromCharCode(0x2014);

// Roots to scan, relative to the repo root (this file lives at tests/unit/).
const REPO_ROOT = join(__dirname, '..', '..');
const SCAN_DIRS = ['src', 'scripts', 'tests', 'docs'];
const SCAN_FILES = ['README.md'];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.md',
  '.css',
]);

const IGNORED_DIRS = new Set(['node_modules', '.next', 'coverage', 'dist', '.git']);

function collectFiles(dir: string, acc: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, acc);
    } else if (TEXT_EXTENSIONS.has(extname(entry))) {
      acc.push(full);
    }
  }
}

describe('project rule: no em dashes', () => {
  test('no source or documentation file contains an em dash', () => {
    const files: string[] = [];
    for (const dir of SCAN_DIRS) collectFiles(join(REPO_ROOT, dir), files);
    for (const file of SCAN_FILES) files.push(join(REPO_ROOT, file));

    const offenders = files.filter((file) => {
      try {
        return readFileSync(file, 'utf8').includes(EM_DASH);
      } catch {
        return false;
      }
    });

    expect(
      offenders,
      `Em dash found in:\n${offenders.join('\n')}\nReplace it with a hyphen. No em dashes are allowed in this repo.`
    ).toEqual([]);
  });
});
