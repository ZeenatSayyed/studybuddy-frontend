const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  question:    String,
  options:     [String],
  answer:      String,
  explanation: String
});

module.exports = mongoose.model("Quiz", QuizSchema);
