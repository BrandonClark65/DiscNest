import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer | null = null;
let startup: Promise<void> | null = null;

/**
 * Starts an in-memory MongoDB and connects mongoose to it.
 *
 * mongoose is a process-wide singleton, so this is idempotent: calling it more
 * than once in the same test file (e.g. from several `describe` blocks) reuses
 * the existing server/connection instead of spinning up a second one and
 * leaving the first orphaned.
 */
export async function connectTestDb() {
  if (startup) {
    await startup;
    return;
  }

  startup = (async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  })();

  try {
    await startup;
  } catch (err) {
    startup = null;
    mongoServer = null;
    throw err;
  }
}

/**
 * Tears down the connection and the in-memory server.
 * Safe to call when nothing was started (or when it was already closed).
 */
export async function closeTestDb() {
  if (!startup) return;

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.connection.close();
  } finally {
    await mongoServer?.stop();
    mongoServer = null;
    startup = null;
  }
}

/**
 * Empties every collection between tests.
 *
 * ALWAYS await this. It is asynchronous, so a fire-and-forget call from a
 * non-async `afterEach` lets the deletes land in the middle of the *next*
 * test, silently removing documents that test just created.
 */
export async function resetTestDb() {
  if (mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      try {
        await collection.deleteMany({});
      } catch {
        // Ignore errors during cleanup (e.g. collection already dropped)
      }
    })
  );
}
