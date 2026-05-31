/**
 * @fileoverview MongoDB connection helper.
 * Wraps mongoose.connect with retry-friendly error handling and
 * lifecycle event logging so connection issues surface immediately.
 */

import mongoose from "mongoose";
import config from "./env.js";

/**
 * Connect to MongoDB using the URI defined in config.
 * Registers event listeners for connection lifecycle events.
 * @returns {Promise<typeof mongoose>} The mongoose instance after a successful connection.
 */
const connectDB = async () => {
  try {
    // ── Lifecycle listeners ──────────────────────────────────────────
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🛑 MongoDB connection closed (app termination)");
      process.exit(0);
    });

    // ── Establish connection ─────────────────────────────────────────
    const conn = await mongoose.connect(config.MONGODB_URI, {
      // Mongoose 8 uses sensible defaults; explicit options kept for clarity
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`📦 MongoDB host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("💥 Failed to connect to MongoDB:", error.message);
    console.warn(
      "⚠️  Running in offline mode - MongoDB will be required for data persistence",
    );
    console.warn(
      '📝 Tip: Start MongoDB with "mongod" command when ready to use database',
    );
    return null; // Allow app to continue without database
  }
};

export default connectDB;
