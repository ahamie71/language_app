# LinguaAI Backend - Node.js

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Database
```bash
mysql -u root -p < database/schema.sql
```

Or manually in MySQL:
```sql
source database/schema.sql
```

### 3. Configure environment
Edit `.env` file with your database credentials and API keys.

### 4. Start server
```bash
npm run dev
```

Server will run on: http://localhost:8000

## 📁 Structure

```
backend/
├── database/          # SQL schema
├── src/
│   ├── config/       # Database config
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth & validation
│   ├── models/       # Sequelize models
│   ├── routes/       # API routes
│   └── server.js     # Entry point
├── .env              # Environment variables
└── package.json
```

## 🔧 Environment Variables

See `.env` file for configuration.

## 📡 API Documentation

Once server is running, visit: http://localhost:8000
