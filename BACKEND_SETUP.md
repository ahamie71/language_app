# Language App Backend - Architecture

## 🏗️ Architecture

- **Node.js/Express** - Main backend API (port import.meta.env.VITE_API_URL)
- **MySQL** - Database

## 📁 Structure

```
backend/          # Node.js Backend
├── src/
│   ├── config/         # Database config
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Auth middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   └── server.js       # Main server file
├── .env
└── package.json
```

## 🚀 Setup Instructions

### 1. Node.js Backend

```bash
cd backend
npm install
npm run dev
```

Server will start on: http://localhost:import.meta.env.VITE_API_URL

### 3. Frontend

The frontend (React) stays the same and connects to Node.js on port import.meta.env.VITE_API_URL.

## 📡 API Endpoints

All endpoints are the same as before:
- `/auth/register` - Register user
- `/auth/login` - Login user
- `/user/me` - Get profile
- `/user/stats` - Get stats
- `/conversations` - List/Create conversations
- `/conversations/:id/messages` - Get messages
- `/conversations/messages` - Create message
## 🔄 How It Works

1. **Frontend** → **Node.js** (All API calls)
2. **Node.js** → **MySQL** (Database operations)

## ✅ Advantages

- 🚀 Node.js for fast API handling
- 📦 Easy to scale each service independently
- 🔧 Clean separation of concerns
