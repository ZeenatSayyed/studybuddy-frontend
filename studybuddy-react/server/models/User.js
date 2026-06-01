const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name:         String,
  email:        { type: String, unique: true },
  password:     String,
  loginStreak:  { type: Number, default: 0 },
  maxStreak:    { type: Number, default: 0 },
  lastLogin:    Date,
  avatar:        { type: String, default: "🎓" },
bio:           { type: String, default: "" },
college:       { type: String, default: "" },
branch:        { type: String, default: "" },
year:          { type: String, default: "" },
totalNotes:    { type: Number, default: 0 },
totalQuizzes:  { type: Number, default: 0 },
totalSessions: { type: Number, default: 0 },
totalAI:       { type: Number, default: 0 },
createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

