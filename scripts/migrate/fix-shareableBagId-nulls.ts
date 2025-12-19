/**
 * Migration: Fix shareableBagId null values
 * 
 * This script removes null values from shareableBagId field for users who have it set to null.
 * This fixes the E11000 duplicate key error that occurs when multiple users have shareableBagId: null
 * with a unique sparse index.
 * 
 * Run with: npx tsx scripts/migrate/fix-shareableBagId-nulls.ts
 */

import mongoose from 'mongoose';
import User from '../../src/models/User';
import { connectToDatabase } from '../../src/lib/mongodb';

async function fixShareableBagIdNulls() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Find all users with shareableBagId set to null
    const usersWithNull = await User.find({ shareableBagId: null });
    console.log(`📊 Found ${usersWithNull.length} users with shareableBagId: null`);

    if (usersWithNull.length === 0) {
      console.log('✅ No users with null shareableBagId found. Migration not needed.');
      process.exit(0);
    }

    // Unset the shareableBagId field for these users (removes the field entirely)
    const result = await User.updateMany(
      { shareableBagId: null },
      { $unset: { shareableBagId: '' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users (removed null shareableBagId)`);
    console.log('✅ Migration complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
fixShareableBagIdNulls();

