const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

require("./db");
const CallLog = require("./models/CallLog");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json({ limit: "50mb" })); // important for base64

// ---------------- TEXT ANALYSIS ----------------
app.post("/analyze-call", async (req, res) => {
  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "Transcript is required" });
  }

  const command = `python3 ml/predict.py "${transcript}"`;

  exec(command, async (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: "ML processing failed" });
    }

    const [status, risk_level, probability] = stdout.trim().split("|");

    await CallLog.create({
      type: "text",
      transcript,
      status,
      risk_level,
      probability: Number(probability)
    });

    res.json({
      status,
      risk_level,
      probability: Number(probability)
    });
  });
});


// ---------------- AUDIO BASE64 + WHISPER ----------------
app.post("/analyze-audio-base64", async (req, res) => {
  const { audio_base64 } = req.body;

  if (!audio_base64) {
    return res.status(400).json({ error: "audio_base64 is required" });
  }

  try {
    // 1️⃣ Base64 → audio file
    const audioBuffer = Buffer.from(audio_base64, "base64");
    const audioPath = path.join(__dirname, "uploads", `audio_${Date.now()}.wav`);

    fs.writeFileSync(audioPath, audioBuffer);

    // 2️⃣ Whisper speech-to-text
    const whisperCmd = `python3 ml/transcribe.py ${audioPath}`;

    exec(whisperCmd, (err, stdout) => {
      if (err) {
        return res.status(500).json({ error: "Whisper transcription failed" });
      }

      const transcript = stdout.trim();

      // 3️⃣ Fraud ML prediction
      const mlCmd = `python3 ml/predict.py "${transcript}"`;

      exec(mlCmd, async (err2, stdout2) => {
        if (err2) {
          return res.status(500).json({ error: "Fraud model failed" });
        }

        const [status, risk_level, probability] = stdout2.trim().split("|");

        // 4️⃣ Save to MongoDB
        await CallLog.create({
          type: "audio",
          transcript,
          status,
          risk_level,
          probability: Number(probability)
        });

        res.json({
          transcript,
          status,
          risk_level,
          probability: Number(probability)
        });
      });
    });
  } catch (e) {
    res.status(500).json({ error: "Audio processing error" });
  }
});


// ---------------- HISTORY ----------------
app.get("/history", async (req, res) => {
  const logs = await CallLog.find().sort({ createdAt: -1 });
  res.json(logs);
});


// ---------------- SERVER ----------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
