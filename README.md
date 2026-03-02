<div align="center">
  <img width="1200" height="475" alt="NutriCan Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>NutriCan</h1>
  <p><strong>AI-powered nutrition and wellness companion for cervical cancer patients and survivors.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white" />
  </p>
</div>

---

## Overview

NutriCan is a mobile-first web application that helps cervical cancer patients manage their nutrition and wellness throughout their recovery journey. It uses Google Gemini AI to generate personalised weekly meal plans, check food safety based on a patient's condition, and simulate consultations with AI doctors.

---

## Features

| Feature | Description |
|---|---|
| **Personalised Onboarding** | Collects cancer type, stage, treatment phase, and comorbidities to tailor all recommendations |
| **AI Meal Plans** | Generates a full 7-day meal plan using Gemini AI based on the patient's unique profile |
| **Food Safety Checker** | Scan or type any food to get an instant Safe / Limit / Avoid verdict with clinical reasoning |
| **Barcode / Nutrient Scanner** | Log meals and track daily calorie, sugar, and salt intake |
| **Health Journal** | Log daily weight, blood pressure, energy level, and notes; visualised as charts |
| **Doctor Connect** | AI-simulated specialist consultations (oncologist, dietitian, psychologist) |
| **Symptom Library** | Browse evidence-based food recommendations for common treatment side effects |
| **Document Upload** | Upload medical PDFs to DigitalOcean Spaces for verification |
| **Premium Upgrade** | Free and Premium plan tiers |
| **Dark / Light Mode** | Full theme support |
| **Guest Mode** | Try the app without creating an account |

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** — UI framework
- **Vite** — build tool and dev server
- **Recharts** — health journal charts
- **Google Gemini AI** (`@google/genai`) — meal plans, food safety, doctor chat

### Backend
- **Node.js + Express** — REST API
- **MongoDB Atlas + Mongoose** — database
- **JWT** (`jsonwebtoken`) — stateless authentication
- **bcryptjs** — password hashing
- **DigitalOcean Spaces** (S3-compatible) — medical document storage
- **Multer** — file upload handling

---

## Project Structure

```
NutriCan-Mobile/
├── components/          # React UI components
│   ├── AuthScreen.tsx   # Sign up / Sign in / Guest login
│   ├── Dashboard.tsx    # Main app (all dashboard pages)
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── TermsScreen.tsx
│   └── Icons.tsx
├── contexts/
│   └── ThemeContext.tsx  # Dark/light mode
├── services/
│   ├── db.ts            # REST API client (auth, journal, meals, docs)
│   ├── config.ts        # API base URL config
│   └── geminiService.ts # All Gemini AI calls
├── types.ts             # Shared TypeScript types
├── App.tsx              # Page router
├── .env.example         # Frontend env template
│
└── backend/
    ├── server.js              # Express entry point
    ├── db/
    │   ├── connection.js      # MongoDB connection + index setup
    │   └── seed.js            # Dev seed script
    ├── middleware/
    │   └── auth.js            # JWT verification middleware
    ├── models/
    │   ├── User.js
    │   ├── JournalEntry.js
    │   ├── Meal.js
    │   └── Document.js
    ├── routes/
    │   ├── auth.js            # POST /signup, /signin, /guest, GET /me
    │   ├── profile.js         # GET/PATCH /profile, POST /upgrade
    │   ├── journal.js         # GET/POST /journal
    │   ├── meals.js           # GET/POST /meals
    │   └── documents.js       # POST /upload, GET /documents
    ├── .env.example           # Backend env template
    └── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [MongoDB Atlas](https://cloud.mongodb.com) account (free tier works)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- *(Optional)* A [DigitalOcean Space](https://cloud.digitalocean.com/spaces) for document uploads

---

### 1. Clone the repo

```bash
git clone https://github.com/balirwaalvin/NutriCan-Mobile.git
cd NutriCan-Mobile
```

### 2. Install dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### 3. Configure environment variables

**Frontend** — create `.env` in the project root:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:4000
```

**Backend** — create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nutrican?retryWrites=true&w=majority

# JWT secret – use a long random string
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# DigitalOcean Spaces (optional – only needed for document upload)
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=your-space-name
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key

PORT=4000
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=development
```

> **MongoDB Atlas tip:** Go to **Security → Network Access** and add your IP (or `0.0.0.0/0` for development) so Atlas accepts your connection.

### 4. Add your Gemini API key

The frontend reads the key from `process.env.API_KEY`. Add it to your `.env`:

```env
VITE_API_KEY=your_gemini_api_key_here
```

### 5. Run the app

```bash
npm run dev
```

This single command starts **both** the frontend and backend in parallel:

| Server | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:4000 |

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Path | Description | Auth required |
|---|---|---|---|
| `POST` | `/signup` | Register a new user | No |
| `POST` | `/signin` | Sign in and receive JWT | No |
| `POST` | `/guest` | Create a temporary guest session | No |
| `GET` | `/me` | Validate token and return profile | Yes |

### Profile — `/api/profile`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get current user profile |
| `PATCH` | `/` | Update profile fields |
| `POST` | `/upgrade` | Upgrade to Premium plan |

### Journal — `/api/journal`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get last 30 journal entries |
| `POST` | `/` | Add a new entry (weight, energy, bp, notes) |

### Meals — `/api/meals`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get last 50 meal logs |
| `POST` | `/` | Log a meal with nutrient info |

### Documents — `/api/documents`

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload` | Upload a PDF to DigitalOcean Spaces |
| `GET` | `/` | List documents with signed download URLs |

### Health check

```
GET /health
```
```json
{
  "status": "ok",
  "db": { "status": "connected", "host": "...", "db": "nutrican", "readyState": 1 }
}
```

---

## Available Scripts

From the **project root:**

```bash
npm run dev            # Start frontend + backend together
npm run dev:frontend   # Start Vite only
npm run dev:backend    # Start Express server only
npm run build          # Production build (frontend)
```

From the **`backend/` directory:**

```bash
npm run dev    # Start server with nodemon (auto-restart)
npm run start  # Start server (production)
npm run seed   # Seed the database with demo data
```

---

## Seed Data (Development)

To populate the database with a demo user and sample journal/meal entries:

```bash
cd backend
npm run seed
```

Demo credentials after seeding:

```
Email:    demo@nutrican.app
Password: password123
```

---

## Deployment

### Frontend
Deploy the `dist/` folder (generated by `npm run build`) to any static host:
- [Vercel](https://vercel.com) — connect your GitHub repo and set `VITE_API_URL` to your backend URL
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)

### Backend
Deploy the `backend/` folder to:
- [Railway](https://railway.app) — recommended, free tier available
- [Render](https://render.com)
- Any VPS (DigitalOcean Droplet, AWS EC2, etc.)

Set all env vars from `backend/.env.example` in your hosting dashboard.

---

## Security Notes

- **Never commit `.env` files** — they are listed in `.gitignore`
- JWT tokens are stored in `localStorage` and sent via `Authorization: Bearer` headers
- Medical documents are stored in a **private** DigitalOcean Space; download links are short-lived signed URLs (15 min expiry)
- Passwords are hashed with `bcryptjs` (12 salt rounds) and never returned in API responses

---

## License

MIT © [Alvin Balirwa](https://github.com/balirwaalvin)
