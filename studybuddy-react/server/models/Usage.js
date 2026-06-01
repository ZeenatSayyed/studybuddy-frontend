const mongoose = require("mongoose");

const UsageSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  feature: { type: String, enum: ["notes", "quiz", "timer", "ai", "chat"] },
  date:    Date,
  count:   { type: Number, default: 0 }
});

UsageSchema.index({ userId: 1, feature: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Usage", UsageSchema);
