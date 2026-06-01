const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const Groq       = require("groq-sdk");
const http       = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const User  = require("./models/User");
const Note  = require("./models/Note");
const Quiz  = require("./models/Quiz");
const Chat  = require("./models/Chat");
const Usage = require("./models/Usage");
const Task  = require("./models/Task");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

app.get("/", (req, res) => res.send("StudyBuddy API Running 🚀"));

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

async function trackUsage(userId, feature) {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    await Usage.findOneAndUpdate(
      { userId, feature, date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
  } catch(e) { console.log("usage track err", e.message); }
}

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered" });
    const hashed  = await bcrypt.hash(password, 10);
    const newUser = await new User({ name, email, password: hashed }).save();
    const token   = jwt.sign({ id: newUser._id, name, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Account created", token, user: { id: newUser._id, name, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ message: "Invalid password" });

    const now   = new Date(); now.setHours(0,0,0,0);
    const last  = user.lastLogin ? new Date(user.lastLogin) : null;
    if (last) { last.setHours(0,0,0,0); }
    const diff  = last ? (now - last) / 86400000 : null;
    if (diff === null || diff > 1)  { user.loginStreak = 1; }
    else if (diff === 1)            { user.loginStreak = (user.loginStreak || 0) + 1; }
    user.lastLogin = new Date();
    if (user.loginStreak > (user.maxStreak||0)) user.maxStreak = user.loginStreak;
    await user.save();

    const token = jwt.sign({ id: user._id, name: user.name, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, email, loginStreak: user.loginStreak, maxStreak: user.maxStreak } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/notes", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await new Note({ title, content, userId: req.user.id }).save();
    await trackUsage(req.user.id, "notes");
    res.json({ message: "Note created", note });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/notes", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/notes/:id", authMiddleware, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/notes/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title: req.body.title, content: req.body.content },
      { new: true }
    );
    res.json(note);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── QUESTION BANK ── */
app.get("/quiz", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.find();
    await trackUsage(req.user.id, "quiz");
    res.json(quiz);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/quiz/add", authMiddleware, async (req, res) => {
  try {
    const { question, options, answer, explanation } = req.body;
    if (!question || !options || !answer)
      return res.status(400).json({ error: "question, options, answer required" });
    const q = await Quiz.create({ question, options, answer, explanation });
    res.json(q);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/quiz/:id", authMiddleware, async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── AI MCQ QUIZ FROM NOTES ── */
app.post("/quiz/from-notes", authMiddleware, async (req, res) => {
  try {
    const { notesText, numQuestions = 5 } = req.body;
    const prompt = `You are a quiz generator. Based on the following study notes, generate exactly ${numQuestions} multiple choice questions.

NOTES:
${notesText}

CRITICAL RULES:
1. The "answer" field MUST be copied EXACTLY from one of the "options" array values.
2. Every question must have exactly 4 options.
3. Return ONLY a raw JSON array. No markdown, no backticks.

Format:
[
  {
    "question": "What does HTML stand for?",
    "options": ["Hypertext Markup Language", "Hypertext Machine Language", "Hightext Markup Language", "Hypertext Marking Language"],
    "answer": "Hypertext Markup Language",
    "explanation": "HTML stands for HyperText Markup Language."
  }
]`;

    const chat = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000
    });

    let raw = chat.choices[0].message.content.trim();
    raw = raw.replace(/```json|```/g, "").trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");
    let questions = JSON.parse(match[0]);

    questions = questions.map(q => {
      const opts = q.options.map(o => o.trim());
      const ans  = (q.answer || "").trim();
      if (opts.includes(ans)) return { ...q, options: opts, answer: ans };
      const ci = opts.find(o => o.toLowerCase() === ans.toLowerCase());
      if (ci) return { ...q, options: opts, answer: ci };
      const partial = opts.find(o =>
        o.toLowerCase().includes(ans.toLowerCase()) ||
        ans.toLowerCase().includes(o.toLowerCase())
      );
      if (partial) return { ...q, options: opts, answer: partial };
      return { ...q, options: opts, answer: opts[0] };
    });

    await trackUsage(req.user.id, "quiz");
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── AI Q&A QUESTION PAPER FROM NOTES ── */
app.post("/quiz/qa-paper", authMiddleware, async (req, res) => {
  try {
    const { notesText, numQuestions = 5 } = req.body;
    const prompt = `You are an exam paper generator. Based on the following study notes, generate exactly ${numQuestions} short-answer questions (NOT multiple choice).

NOTES:
${notesText}

RULES:
1. Questions must require a written answer (1-3 sentences), NOT MCQ options.
2. Include a model answer for each question.
3. Include marks (1-5) per question based on difficulty.
4. Include a short hint for each question.
5. Return ONLY a raw JSON array. No markdown, no backticks.

Format:
[
  {
    "question": "What is photosynthesis?",
    "modelAnswer": "Photosynthesis is the process by which plants convert sunlight, water and CO2 into glucose and oxygen.",
    "marks": 2,
    "hint": "Think about what plants need to make food."
  }
]`;

    const chat = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000
    });

    let raw = chat.choices[0].message.content.trim();
    raw = raw.replace(/```json|```/g, "").trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");
    const questions = JSON.parse(match[0]);
    await trackUsage(req.user.id, "quiz");
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/room-ai", authMiddleware, async (req, res) => {
  try {
    const { question, room } = req.body;
    const chat = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are StudyBuddy AI, a helpful classroom study assistant. Answer clearly and concisely. Use bullet points for lists. Keep answers under 150 words unless asked for more detail." },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile", max_tokens: 400
    });
    const answer = chat.choices[0].message.content;
    const msg = await new Chat({ room, username: "StudyBuddy AI", text: answer, isAI: true }).save();
    await trackUsage(req.user.id, "ai");
    res.json({ answer, msgId: msg._id, createdAt: msg.createdAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const studySessions = [];

app.post("/sessions/create", authMiddleware, (req, res) => {
  const { platform, link, topic } = req.body;
  if (!platform || !link) return res.status(400).json({ error: "platform and link required" });
  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  const session = { id, platform, link, topic: topic || "Study Session", hostName: req.user.name, createdAt: new Date() };
  studySessions.unshift(session);
  if (studySessions.length > 50) studySessions.pop();
  res.json(session);
});

app.get("/sessions", authMiddleware, (req, res) => {
  res.json(studySessions.slice(0, 20));
});

app.delete("/sessions/:id", authMiddleware, (req, res) => {
  const idx = studySessions.findIndex(s => s.id === req.params.id);
  if (idx !== -1) studySessions.splice(idx, 1);
  res.json({ success: true });
});

app.post("/ask-ai", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    const chat = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are StudyBuddy AI, a helpful exam preparation assistant. Be concise, friendly, and educational." },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000
    });
    await trackUsage(req.user.id, "ai");
    res.json({ answer: chat.choices[0].message.content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/usage", authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const data = await Usage.find({ userId: req.user.id, date: { $gte: thirtyDaysAgo } });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/usage/timer", authMiddleware, async (req, res) => {
  try {
    await trackUsage(req.user.id, "timer");
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get("/dm/:otherUser", authMiddleware, async (req, res) => {
  try {
    const roomId = `dm_${[req.user.name, req.params.otherUser].sort().join('_')}`;
    const messages = await Chat.find({ room: roomId }).sort({ createdAt: -1 }).limit(50).sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/chat/:room", authMiddleware, async (req, res) => {
  try {
    const messages = await Chat.find({ room: req.params.room })
      .sort({ createdAt: -1 }).limit(50).sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const { title, date, priority } = req.body;
    if (!title || !date) return res.status(400).json({ error: "title and date required" });
    const task = await Task.create({ userId: req.user.id, title, date, priority: priority || "medium" });
    res.json(task);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body, { new: true }
    );
    res.json(task);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const privateRooms = {};

app.post("/rooms/create", authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Room name required" });
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  privateRooms[code] = { name, creator: req.user.name, members: [req.user.name], code };
  res.json({ code, name });
});

app.post("/rooms/join", authMiddleware, (req, res) => {
  const { code } = req.body;
  const room = privateRooms[code?.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Invalid invite code" });
  if (!room.members.includes(req.user.name)) room.members.push(req.user.name);
  res.json(room);
});

/* ── SOCKET.IO ── */
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", ({ room, username }) => {
    socket.join(room);
    socket.data.room     = room;
    socket.data.username = username;
    if (!onlineUsers[room]) onlineUsers[room] = new Set();
    onlineUsers[room].add(username);
    io.to(room).emit("online-users", [...onlineUsers[room]]);
    socket.to(room).emit("user-joined", { username, time: new Date() });
  });

  socket.on("send-message", async ({ room, username, text }) => {
    const msg = await new Chat({ room, username, text }).save();
    io.to(room).emit("new-message", { _id: msg._id, username, text, createdAt: msg.createdAt });
  });

  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("user-typing", username);
  });

  socket.on("stop-typing", ({ room }) => {
    socket.to(room).emit("stop-typing");
  });

socket.on("direct-message", async ({ toUsername, fromUsername, text }) => {
  const msg = await new Chat({ room: `dm_${[fromUsername,toUsername].sort().join('_')}`, username: fromUsername, text }).save();
  const allSockets = await io.fetchSockets();
  const target = allSockets.find(s => s.data.username === toUsername);
  if (target) target.emit("dm-received", { from: fromUsername, text, createdAt: msg.createdAt, _id: msg._id });
  socket.emit("dm-received", { from: fromUsername, text, createdAt: msg.createdAt, _id: msg._id, self: true });
});

socket.on("broadcast-ai", ({ room, text, createdAt, msgId }) => {
  io.to(room).emit("ai-response", {
    _id: msgId, username: "StudyBuddy AI",
    text, createdAt, isAI: true, type: "ai"
  });
});

  socket.on("disconnect", () => {
    const { room, username } = socket.data;
    if (room && username && onlineUsers[room]) {
      onlineUsers[room].delete(username);
      io.to(room).emit("online-users", [...onlineUsers[room]]);
      io.to(room).emit("user-left", { username });
    }
  });
});

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, bio, college, branch, year, avatar } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, college, branch, year, avatar },
      { new: true, select: "-password" }
    );
    res.json({ message: "Profile updated", user: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

server.listen(process.env.PORT || 5000, () => console.log("Server running 🚀"));