# ⬡ TaskFlow — Team Task Manager

A full-stack web app for teams to create projects, assign tasks, and track progress with role-based access control (Admin/Member).

## ✨ Features

- **Authentication** — JWT-based signup/login with secure password hashing
- **Projects** — Create and manage multiple projects; invite team members
- **Role-Based Access** — Admins can manage members/tasks; Members can view and update tasks
- **Tasks** — Create, assign, prioritize, and track tasks with due dates
- **Kanban Board** — Visual Todo / In Progress / Done columns with quick status updates
- **Dashboard** — Overview of all tasks, overdue count, and per-project progress bars
- **Responsive UI** — Works on desktop and mobile

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Railway |

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd taskflow

# Install backend deps
cd backend && npm install

# Install frontend deps  
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
JWT_SECRET=your_super_secret_key_here_min_32_chars
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Run

```bash
# Terminal 1 — Backend (auto-creates DB tables on start)
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

App runs at **http://localhost:3000**

## 🌐 Deploy on Railway

### Step 1 — Create Railway project
1. Go to [railway.app](https://railway.app) and create a new project
2. Click **"Deploy from GitHub repo"** and connect this repository

### Step 2 — Add PostgreSQL
1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway auto-sets `DATABASE_URL` — copy it

### Step 3 — Set Environment Variables
In your Railway service settings → Variables:

```
DATABASE_URL=<auto-set by Railway PostgreSQL>
JWT_SECRET=<generate a strong random string>
NODE_ENV=production
PORT=<auto-set by Railway>
```

### Step 4 — Deploy
Railway will auto-build using `nixpacks.toml`:
- Installs backend + frontend dependencies
- Builds React app → copies to `backend/public`
- Starts Express server which serves both API and frontend

### Step 5 — Get Live URL
Railway provides a `.railway.app` domain. Set it as your live URL.

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL connection + schema init
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   └── taskController.js
│   │   ├── middleware/auth.js    # JWT auth + role guard
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   └── tasks.js
│   │   └── index.js             # Express app entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/Layout    # Sidebar navigation
│   │   ├── context/AuthContext  # Global auth state
│   │   ├── pages/
│   │   │   ├── Login / Signup
│   │   │   ├── Dashboard        # Stats + task overview
│   │   │   ├── Projects         # Project list
│   │   │   └── ProjectDetail    # Kanban + members
│   │   └── utils/api.js         # Axios instance
│   └── package.json
├── railway.json
├── nixpacks.toml
└── README.md
```

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects` | All members |
| POST | `/api/projects` | Authenticated |
| GET | `/api/projects/:id` | Members |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Owner |
| GET/POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:uid` | Admin |

### Tasks
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects/:id/tasks` | Members |
| POST | `/api/projects/:id/tasks` | Members |
| PUT | `/api/projects/:id/tasks/:tid` | Members |
| DELETE | `/api/projects/:id/tasks/:tid` | Admin |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats + my tasks |

