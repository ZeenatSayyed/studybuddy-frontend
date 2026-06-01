# 📚 StudyBuddy v2 — React + Vite

## 🗂️ Project Structure
```
studybuddy-react/
├── client/                  ← React + Vite frontend
│   ├── src/
│   │   ├── pages/           ← Dashboard, Notes, Quiz, Timer, AI, Classroom, Calendar, Settings
│   │   ├── components/      ← Modal, Toast, Particles
│   │   ├── context/         ← AppContext (global state)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        ← All styles + 3 themes
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── server/                  ← Express + MongoDB backend
    ├── server.js
    ├── models/
    ├── package.json
    └── .env
```

---

## 🚀 How to Run

### Step 1 — Start MongoDB
**Windows:** Open MongoDB Compass OR run: `net start MongoDB`

### Step 2 — Start Backend
```bash
cd studybuddy-react/server
npm install
node server.js
```
Should show:
```
Server running on port 5000 🚀
MongoDB Connected ✅
```

### Step 3 — Start Frontend
```bash
cd studybuddy-react/client
npm install
npm run dev
```
Open: **http://localhost:5173**

---

## ✨ All Features

| Feature | Description |
|---|---|
| 🔐 Auth | Signup/Login with JWT |
| 🔥 Login Streak | Daily streak tracking |
| 📝 Notes | Create, edit, delete, search |
| 🤖 AI Quiz | Groq AI generates MCQs from YOUR notes |
| 🗄️ DB Quiz | Quiz from MongoDB question bank |
| ⏱️ Timer | Pomodoro with animated SVG ring |
| 💬 Classroom | Real-time Socket.IO chat (4 rooms) |
| 📅 Calendar | Activity calendar + feature usage stats |
| 👥 Group Study | Meet, Zoom, Discord, Miro links |
| 🎨 Settings | 3 themes: Cosmos / Solar / Forest |

## 🎨 Themes
- **Cosmos** — Deep space purple/teal (default)
- **Solar** — Warm golden light
- **Forest** — Nature green dark
