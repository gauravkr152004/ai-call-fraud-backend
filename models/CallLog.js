const mongoose = require("mongoose");

const CallLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["text", "audio"],
    required: true
  },
  transcript: String,
  status: String,
  risk_level: String,
  probability: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CallLog", CallLogSchema);
