import { Schema, model, models } from "mongoose";

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
    metadata: { type: Object },
    resolved: { type: Boolean, default: false },

    // ✅ NEW - distinguishes error origin
    source: {
      type: String,
      enum: ["server", "client"],
      default: "server",
    },
  },
  { timestamps: true }
);

const ErrorLog = models.ErrorLog || model("ErrorLog", ErrorLogSchema);
export default ErrorLog;
