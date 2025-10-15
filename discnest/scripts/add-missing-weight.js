// scripts/add-missing-weight.js
// node --loader tsx scripts/add-missing-weight.js


import mongoose from "mongoose";
import dotenv from "dotenv";
import Disc from "../models/Disc.js"; // adjust this import path if your models are stored elsewhere
import { connectToDatabase } from "../lib/mongodb.js"; // or your existing DB connect util

dotenv.config();

(async () => {
  try {
    // connect to Mongo
    await connectToDatabase();

    // Find discs missing the weight field
    const discsWithoutWeight = await Disc.find({ weight: { $exists: false } });
    console.log(`🧮 Found ${discsWithoutWeight.length} discs without a weight field.`);

    if (discsWithoutWeight.length === 0) {
      console.log("✅ Nothing to update — all discs already have a weight field.");
      process.exit(0);
    }

    // Update them (set weight to null or default value)
    const res = await Disc.updateMany(
      { weight: { $exists: false } },
      { $set: { weight: null } } // you can use { weight: 175 } or whatever makes sense
    );

    console.log(`✅ Updated ${res.modifiedCount} discs.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating discs:", err);
    process.exit(1);
  }
})();
