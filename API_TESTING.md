# AI FitTrack — API Testing Guide

Use Postman, Thunder Client, or `curl`. All endpoints (except `/api/health`, `/api/auth/register`, `/api/auth/login`) require:

```
Authorization: Bearer <JWT_TOKEN>
```

Base URL for local development: `http://localhost:5000/api`

---

## Recommended testing order

### 1. Health check
```
GET /api/health
```
**Expected:** `200`
```json
{ "success": true, "message": "AI FitTrack API is running" }
```

### 2. Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "Rahul@123"
}
```
**Expected:** `201`, response includes `data.user` (no password field) and `data.token`.

### 3. Login
```
POST /api/auth/login

{
  "email": "rahul@example.com",
  "password": "Rahul@123"
}
```
**Expected:** `200` with `data.token`. **Copy this token** for the next steps.

### 4. Profile
```
GET /api/auth/profile
Authorization: Bearer <TOKEN>
```
**Expected:** `200` with `id`, `name`, `email`, `createdAt` — no password.

### 5. Create workout
```
POST /api/workouts
Authorization: Bearer <TOKEN>

{
  "workoutName": "Morning Running",
  "category": "Cardio",
  "duration": 30,
  "caloriesBurned": 250,
  "workoutDate": "2026-09-18"
}
```
**Expected:** `201` with the created workout, `user` field set to the authenticated user's ID automatically.

### 6. Get all workouts
```
GET /api/workouts
Authorization: Bearer <TOKEN>
```
**Expected:** `200` with `data.workouts` (only this user's workouts) and `data.pagination`.

### 7. Search
```
GET /api/workouts/search?query=running
Authorization: Bearer <TOKEN>
```
Also try `?category=Cardio` and `?date=2026-09-18`.
**Expected:** `200` with matching workouts only.

### 8. Get one workout
```
GET /api/workouts/:id
Authorization: Bearer <TOKEN>
```
**Expected:** `200` with the workout, only if it belongs to you.

### 9. Update
```
PUT /api/workouts/:id
Authorization: Bearer <TOKEN>

{ "duration": 40, "caloriesBurned": 300 }
```
**Expected:** `200` with the updated workout.

### 10. Statistics
```
GET /api/workouts/statistics
Authorization: Bearer <TOKEN>
```
**Expected:** `200` with `totalWorkouts`, `averageDuration`, `totalCaloriesBurned`, `totalDuration`, `categoryBreakdown` — all calculated live from MongoDB.

### 11. Delete
```
DELETE /api/workouts/:id
Authorization: Bearer <TOKEN>
```
**Expected:** `200` success message. Verify with `GET /api/workouts/:id` → `404`.

### 12. AI recommendation
```
POST /api/ai/recommendation
Authorization: Bearer <TOKEN>

{ "age": 22, "fitnessGoal": "Weight Loss", "experienceLevel": "Beginner" }
```
**Expected:** `200` with a structured Gemini-generated plan (`workoutPlan`, `weeklySchedule`, `suitableExercises`, `trainingTips`, `safetyRecommendations`, `motivationalMessage`, `disclaimer`).

### 13. AI insights
```
POST /api/ai/insights
Authorization: Bearer <TOKEN>

{}
```
Sending an empty body makes the backend calculate `totalWorkouts`, `averageDuration`, and `caloriesBurned` automatically from your real logged workouts. You can also supply these manually:
```json
{ "totalWorkouts": 12, "averageDuration": 35, "caloriesBurned": 3200 }
```
**Expected:** `200` with `performanceAnalysis`, `improvementSuggestions`, `motivationalAdvice`, `progressSummary`, `disclaimer`.

---

## Negative testing

Test every one of these — all should return a clean JSON error (`success: false`), never a raw stack trace or an unhandled crash.

| # | Case | Expected status |
|---|------|------------------|
| 1 | Register with empty `name` | 400 |
| 2 | Register with invalid `email` format | 400 |
| 3 | Register with an email that already exists | 409 |
| 4 | Register with a password under 6 characters | 400 |
| 5 | Login with the correct email but wrong password | 401 |
| 6 | Login with an email that doesn't exist | 401 |
| 7 | Access a protected route with no `Authorization` header | 401 |
| 8 | Access a protected route with a malformed header (no `Bearer `) | 401 |
| 9 | Access a protected route with an invalid/garbage JWT | 401 |
| 10 | Access a protected route with an expired JWT | 401 |
| 11 | `GET /api/workouts/:id` with an invalid (non-ObjectId) id | 400 |
| 12 | `GET /api/workouts/:id` with a well-formed but non-existent id | 404 |
| 13 | Create workout with missing `workoutName` | 400 |
| 14 | Create workout with missing `category` | 400 |
| 15 | Create workout with `duration = 0` | 400 |
| 16 | Create workout with negative `duration` | 400 |
| 17 | Create workout with negative `caloriesBurned` | 400 |
| 18 | Create workout with missing `workoutDate` | 400 |
| 19 | User A tries to `GET` User B's workout by id | 403 |
| 20 | User A tries to `PUT` (update) User B's workout | 403 |
| 21 | User A tries to `DELETE` User B's workout | 403 |
| 22 | Call an AI endpoint with `GEMINI_API_KEY` unset/placeholder | 500, clear message, server stays up |
| 23 | Call an AI endpoint while Gemini is unreachable/erroring | 502/504, clear message, server stays up |
| 24 | `GET` an unknown route, e.g. `/api/nonsense` | 404 JSON |

### How to test #19–21 (cross-user ownership)
1. Register **User A**, log in, create a workout, note its `id`.
2. Register **User B**, log in (new token).
3. Using **User B's token**, call `GET /api/workouts/:id`, `PUT /api/workouts/:id`, and `DELETE /api/workouts/:id` on the workout created by User A.
4. All three must return `403 Forbidden` with a message like "You are not authorized to access this workout." User A's workout must remain unchanged afterward.

---

## Notes

- Every success response follows `{ "success": true, "message": "...", "data": {...} }`.
- Every error response follows `{ "success": false, "message": "...", "errors": [...] }` (the `errors` array is included for validation failures).
- No endpoint ever returns a password field, even when `select("+password")` is used internally for login.
- AI endpoints never claim to give medical advice — every response includes a `disclaimer` field, and the underlying system instruction explicitly forbids diagnosis or dangerous recommendations.
