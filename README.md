# AI FitTrack

**Personalized Fitness Tracking & AI Recommendation System**

AI FitTrack is a full-stack fitness tracking application. Users can register, log in, record and manage their workouts, search and review their training history, view real statistics calculated from their own data, and get personalized AI-generated workout recommendations and fitness insights powered by Google Gemini.

---

## Description

The backend is a secure REST API built with Node.js, Express, and MongoDB (via Mongoose), using JWT authentication and bcrypt password hashing. Every workout record is tied to the authenticated user, and the API enforces strict ownership checks so no user can ever read, edit, or delete another user's data.

The included React (Vite) frontend gives the API a real, usable interface: a dashboard with live statistics, a full workout log with search, forms to add/edit workouts, and dedicated pages for the two Gemini-powered AI features.

No part of the app uses fake data, fake AI responses, or hard-coded credentials — statistics come from real MongoDB aggregation queries, and AI content comes from real calls to the Gemini API.

---

## Features

**Authentication**
- Register with name, email, and password (bcrypt-hashed, never stored or returned in plain text)
- Login with JWT issuance
- Protected profile endpoint

**Workout management**
- Create, read, update, and delete workouts
- Every workout is automatically scoped to the logged-in user
- Ownership is verified on every read/update/delete — User A can never touch User B's workouts
- Search workouts by name, category, or date (partial text matching)
- Real, database-calculated statistics: total workouts, average duration, total calories burned, category breakdown

**AI (Google Gemini)**
- `POST /api/ai/recommendation` — personalized workout plan, weekly schedule, suitable exercises, training tips, safety guidance, and motivation, based on age, fitness goal, and experience level
- `POST /api/ai/insights` — performance analysis and improvement suggestions based on the user's real workout statistics (auto-calculated from MongoDB if not supplied manually)
- A dedicated safety system instruction prevents the AI from giving medical diagnoses or claiming to be a medical professional, and every AI response includes a disclaimer
- Gemini failures (missing/invalid key, timeout, network error, malformed response) are caught and turned into clean JSON errors — they never crash the server

**Security**
- bcrypt password hashing
- JWT-based route protection with clear handling of missing/malformed/invalid/expired tokens
- Per-resource ownership authorization
- All secrets loaded from environment variables, never hard-coded
- Centralized error handling — no stack traces or secrets are ever sent to the client
- CORS restricted to a configurable allow-list

**Frontend (optional, included)**
- Register / login pages
- Dashboard with live stats and recent workouts
- Full workout log with search, add, edit, delete, and detail views
- AI Recommendation and AI Insights pages
- Profile page with logout
- Loading indicators, error banners, success banners, and empty states throughout

---

## Technologies

**Backend**
- Node.js, Express.js
- MongoDB, Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- dotenv, cors
- Google Gemini AI (`@google/generative-ai`)
- Nodemon (development)

**Frontend**
- React 19 + Vite
- React Router
- Axios
- Modern hand-written CSS (design tokens, no UI framework)

---

## Project structure

```
AI-FitTrack/
├── server/
│   ├── config/db.js
│   ├── controllers/{authController,workoutController,aiController}.js
│   ├── middleware/{authMiddleware,errorMiddleware,validationMiddleware}.js
│   ├── models/{User,Workout}.js
│   ├── routes/{authRoutes,workoutRoutes,aiRoutes}.js
│   ├── services/{geminiService,jwtService,passwordService}.js
│   ├── utils/response.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── client/                  (optional React frontend)
│   ├── src/{api,components,context,pages,styles}
│   └── ...
├── README.md
└── API_TESTING.md
```

---

## Installation

### 1. Backend

```
cd AI-FitTrack/server
npm install
```

### 2. Frontend (optional)

```
cd AI-FitTrack/client
npm install
```

---

## Environment setup

### Backend — `server/.env`

Copy `server/.env.example` to `server/.env` and fill in your own values:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
CLIENT_ORIGIN=http://localhost:5173
```

Never commit `.env` — it is already listed in `.gitignore`.

### Frontend — `client/.env`

Copy `client/.env.example` to `client/.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

The Gemini API key is **only** ever used on the backend and is never exposed to the frontend.

---

## MongoDB setup

**Option A — Local MongoDB**
1. Install MongoDB Community Server and start the `mongod` service.
2. Use a connection string like:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/ai-fittrack
   ```

**Option B — MongoDB Atlas (cloud, free tier available)**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and password.
3. Under Network Access, allow your IP address (or `0.0.0.0/0` for development).
4. Copy the connection string from the Atlas "Connect" dialog and set:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ai-fittrack
   ```

---

## Gemini setup

1. Go to https://aistudio.google.com/app/apikey and sign in with a Google account.
2. Generate a new API key.
3. Set it in `server/.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. If Gemini is unreachable or the key is invalid, the AI endpoints return a clear JSON error instead of crashing the server — the rest of the app keeps working normally.

---

## Running the backend

```
cd AI-FitTrack/server
npm install
npm run dev      # development, with nodemon auto-restart
```

or for a plain start:

```
npm start
```

The API runs at `http://localhost:5000` by default (or whatever `PORT` is set to).

## Running the frontend

```
cd AI-FitTrack/client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default and talks to the backend at the URL configured in `client/.env`.

---

## API endpoints

**Health**
- `GET /api/health`

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` *(protected)*

**Workouts** *(all protected)*
- `POST /api/workouts`
- `GET /api/workouts`
- `GET /api/workouts/:id`
- `PUT /api/workouts/:id`
- `DELETE /api/workouts/:id`
- `GET /api/workouts/search?query=&category=&date=`
- `GET /api/workouts/statistics`

**AI** *(all protected)*
- `POST /api/ai/recommendation`
- `POST /api/ai/insights`

All responses follow this shape:

```json
{ "success": true, "message": "…", "data": { } }
```
```json
{ "success": false, "message": "…", "errors": [ ] }
```

See `API_TESTING.md` for full request/response examples and a recommended testing order.

---

## Postman / Thunder Client testing

See `API_TESTING.md` for the complete step-by-step testing guide, including the recommended order (health → register → login → profile → workout CRUD → search → statistics → AI), and a full list of negative test cases (invalid input, missing/expired tokens, cross-user access attempts, invalid IDs, and Gemini failures).

---

## Troubleshooting

**MongoDB connection issues**
- `MongoServerError: Authentication failed` — double-check the username/password in `MONGO_URI` (special characters must be URL-encoded).
- Connection hangs or times out on Atlas — confirm your IP is allow-listed under Network Access.
- `ECONNREFUSED` on a local Mongo — make sure the `mongod` service is actually running.

**Port issues**
- `EADDRINUSE: address already in use :::5000` — another process is using the port. Either stop it or change `PORT` in `server/.env`.

**Missing environment variables**
- The server exits immediately at startup with a clear console message if `MONGO_URI` is missing. Double-check `server/.env` exists and is filled in (not just `.env.example`).
- JWT issuance/verification will throw a clear error if `JWT_SECRET` is missing.

**Gemini API issues**
- "Gemini API key is not configured" — set a real `GEMINI_API_KEY` in `server/.env` (not the placeholder value).
- "Gemini rejected the API key" — the key is invalid, expired, or restricted; generate a new one in Google AI Studio.
- "Gemini request timed out" / "Could not reach the Gemini API" — check your network connection and try again; the rest of the app is unaffected.

**npm issues**
- If `npm install` fails, delete `node_modules` and `package-lock.json` and try again.
- Make sure you're using Node.js 18 or newer (`node -v`).
