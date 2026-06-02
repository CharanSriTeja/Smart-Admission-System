/**
 * @fileoverview User model for HOD and Volunteer accounts.
 * Passwords are automatically hashed before save via a pre-save hook.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * @typedef {Object} IUser
 * @property {string}  name       - Full name of the user.
 * @property {string}  email      - Unique login email (stored lowercase).
 * @property {string}  password   - Hashed password.
 * @property {string}  role       - Either 'HOD' or 'Volunteer'.
 * @property {string}  department - Department the user belongs to.
 * @property {Date}    createdAt  - Account creation timestamp.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password must be at least 4 characters"],
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: {
        values: ["Admin", "HOD", "Volunteer"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Exclude __v from JSON serialization
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// email: unique constraint already defined at field level

// ── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre("save", async function preSaveHashPassword(next) {
  // Only hash if the password field was modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// ── Instance methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text candidate password against the stored hash.
 * @param {string} candidatePassword - The password to verify.
 * @returns {Promise<boolean>} True if the password matches.
 */
userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
