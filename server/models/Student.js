/**
 * @fileoverview Student model — central entity of the admission tracker.
 *
 * Each student record tracks three admission steps:
 *   1. selfReported  — student has self-reported online
 *   2. documentsSubmitted — physical documents handed in
 *   3. formFilled — admission form completed
 *
 * A pre-save hook automatically computes completionPercentage and sets
 * completedAt when all three steps are done.
 */

import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    hallTicketNumber: {
      type: String,
      required: [true, "Hall ticket number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    rank: {
      type: Number,
      required: [true, "Rank is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    studentPhone: {
      type: String,
      trim: true,
      default: "",
    },
    parentPhone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "{VALUE} is not a valid gender",
      },
    },
    region: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Admission step flags ──────────────────────────────────────────
    selfReported: {
      type: Boolean,
      default: false,
    },
    selfReportedAt: {
      type: Date,
      default: null,
    },
    selfReportedBy: {
      type: String,
      default: "",
    },
    documentsSubmitted: {
      type: Boolean,
      default: false,
    },
    documentsSubmittedAt: {
      type: Date,
      default: null,
    },
    documentsSubmittedBy: {
      type: String,
      default: "",
    },
    formFilled: {
      type: Boolean,
      default: false,
    },
    formFilledAt: {
      type: Date,
      default: null,
    },
    formFilledBy: {
      type: String,
      default: "",
    },

    // ── Computed / derived ────────────────────────────────────────────
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Soft-delete flag
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// hallTicketNumber: unique constraint already defined at field level
studentSchema.index({ rank: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ name: "text" }); // text search
studentSchema.index({
  department: 1,
  selfReported: 1,
  documentsSubmitted: 1,
  formFilled: 1,
});

// ── Pre-save: compute completionPercentage & completedAt ─────────────────────
studentSchema.pre("save", function preSaveComputeCompletion(next) {
  const steps = [this.selfReported, this.documentsSubmitted, this.formFilled];
  const completedSteps = steps.filter(Boolean).length;

  this.completionPercentage = Math.round((completedSteps / 3) * 100);

  if (completedSteps === 3 && !this.completedAt) {
    this.completedAt = new Date();
  } else if (completedSteps < 3) {
    this.completedAt = null;
  }

  // Auto-backfill missing step timestamps for completed steps
  if (this.selfReported && !this.selfReportedAt) {
    this.selfReportedAt = this.createdAt || new Date();
    this.selfReportedBy = this.selfReportedBy || "System (Imported)";
  }
  if (this.documentsSubmitted && !this.documentsSubmittedAt) {
    this.documentsSubmittedAt = this.createdAt || new Date();
    this.documentsSubmittedBy = this.documentsSubmittedBy || "System (Imported)";
  }
  if (this.formFilled && !this.formFilledAt) {
    this.formFilledAt = this.createdAt || new Date();
    this.formFilledBy = this.formFilledBy || "System (Imported)";
  }

  next();
});

const Student = mongoose.model("Student", studentSchema);

export default Student;
