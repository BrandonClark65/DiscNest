import mongoose, { Schema, model, models } from "mongoose";

const ErrorLogSchema = new Schema(
  {
    message: { type: String, required: true },
    stack: { type: String },
    route: { type: String },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Object }, // any extra context
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ErrorLog = models.ErrorLog || model("ErrorLog", ErrorLogSchema);
export default ErrorLog;
