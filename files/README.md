# 🔄 Barter App

A full-stack web application that enables users to trade goods and services directly — no money required.

---

## 🚀 Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | React 18, React Router, Axios |
| Backend    | Node.js, Express.js |
| Database   | PostgreSQL           |
| Auth       | JWT (JSON Web Tokens) |
| Styling    | Tailwind CSS        |

---

## 📁 Project Structure

```
barter_app/
├── client/                   # React frontend
│   ├── public/
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Page-level components
│       ├── context/          # React context (auth, etc.)
│       ├── hooks/            # Custom hooks
│       ├── services/         # Axios API calls
│       └── App.jsx
├── server/                   # Node.js/Express backend
│   ├── controllers/          # Route handler logic
│   ├── routes/               # Express route definitions
│   ├── middleware/           # Auth, error handling, etc.
│   ├── models/               # DB query functions
│   ├── config/               # DB config, env setup
│   └── index.js              # Entry point
├── database/
│   └── schema.sql            # PostgreSQL schema
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/barter_app.git
cd barter_app
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Set up the database
```bash
psql -U postgres -f database/schema.sql
```

### 4. Install dependencies & run the backend
```bash
cd server
npm install
npm run dev
```

### 5. Install dependencies & run the frontend
```bash
cd client
npm install
npm start
```

App runs at: `http://localhost:3000`  
API runs at: `http://localhost:5000`

---

## 🔑 Core Features

- **User Registration & Login** — JWT-based authentication
- **Post Listings** — List items or services you want to barter
- **Browse & Search** — Discover listings by category or keyword
- **Barter Requests** — Send and manage trade offers
- **Messaging** — In-app chat between traders
- **Profile & Reputation** — Ratings and reviews after completed trades

---

## 🌐 API Endpoints (Overview)

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| POST   | `/api/auth/register`        | Register a new user       |
| POST   | `/api/auth/login`           | Login and receive JWT     |
| GET    | `/api/listings`             | Get all listings          |
| POST   | `/api/listings`             | Create a new listing      |
| GET    | `/api/listings/:id`         | Get a single listing      |
| PUT    | `/api/listings/:id`         | Update a listing          |
| DELETE | `/api/listings/:id`         | Delete a listing          |
| POST   | `/api/trades`               | Propose a trade           |
| GET    | `/api/trades/:id`           | Get trade details         |
| PUT    | `/api/trades/:id/status`    | Accept / decline a trade  |
| GET    | `/api/messages/:tradeId`    | Get messages for a trade  |
| POST   | `/api/messages`             | Send a message            |

---

## 🛡️ Environment Variables

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/barter_app
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

---

## 📄 License

MIT
