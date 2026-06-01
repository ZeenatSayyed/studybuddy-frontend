const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  title:     String,
  content:   String,
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Note", NoteSchema);
