const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  room:      { type: String, default: "general" },
  username:  String,
  text:      String,
  isAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Chat", ChatSchema);
