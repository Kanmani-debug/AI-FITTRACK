const mongoose = require("mongoose");
const { sendError } = require("../utils/response");
const { ALLOWED_CATEGORIES } = require("../models/Workout");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (isBlank(name) || String(name).trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters long.");
  }
  if (isBlank(email) || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push("A valid email address is required.");
  }
  if (isBlank(password) || String(password).length < 6) {
    errors.push("Password is required and must be at least 6 characters long.");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed.", errors);
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (isBlank(email) || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push("A valid email address is required.");
  }
  if (isBlank(password)) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed.", errors);
  }
  next();
};

const validateWorkout = (req, res, next) => {
  const { workoutName, category, duration, caloriesBurned, workoutDate } = req.body || {};
  const errors = [];

  if (isBlank(workoutName) || String(workoutName).trim().length < 2) {
    errors.push("Workout name is required and must be at least 2 characters long.");
  }
  if (isBlank(category) || !ALLOWED_CATEGORIES.includes(String(category).trim())) {
    errors.push(`Category is required and must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`);
  }
  if (isBlank(duration) || Number.isNaN(Number(duration)) || Number(duration) <= 0) {
    errors.push("Duration is required and must be a number greater than 0.");
  }
  if (
    isBlank(caloriesBurned) ||
    Number.isNaN(Number(caloriesBurned)) ||
    Number(caloriesBurned) < 0
  ) {
    errors.push("Calories burned is required and must be a number that is not negative.");
  }
  if (isBlank(workoutDate) || Number.isNaN(Date.parse(workoutDate))) {
    errors.push("A valid workout date is required.");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed.", errors);
  }
  next();
};

// Same rules as create, but every field is optional (partial update)
const validateWorkoutUpdate = (req, res, next) => {
  const { workoutName, category, duration, caloriesBurned, workoutDate } = req.body || {};
  const errors = [];

  if (workoutName !== undefined && String(workoutName).trim().length < 2) {
    errors.push("Workout name must be at least 2 characters long.");
  }
  if (category !== undefined && !ALLOWED_CATEGORIES.includes(String(category).trim())) {
    errors.push(`Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`);
  }
  if (duration !== undefined && (Number.isNaN(Number(duration)) || Number(duration) <= 0)) {
    errors.push("Duration must be a number greater than 0.");
  }
  if (
    caloriesBurned !== undefined &&
    (Number.isNaN(Number(caloriesBurned)) || Number(caloriesBurned) < 0)
  ) {
    errors.push("Calories burned must be a number that is not negative.");
  }
  if (workoutDate !== undefined && Number.isNaN(Date.parse(workoutDate))) {
    errors.push("Workout date must be a valid date.");
  }

  if (Object.keys(req.body || {}).length === 0) {
    errors.push("At least one field must be provided to update.");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed.", errors);
  }
  next();
};

const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, `Invalid ${paramName}. Not a valid resource ID.`);
  }
  next();
};

const validateAiRecommendationInput = (req, res, next) => {
  const { age, fitnessGoal, experienceLevel } = req.body || {};
  const errors = [];

  if (isBlank(age) || Number.isNaN(Number(age)) || Number(age) < 10 || Number(age) > 100) {
    errors.push("Age is required and must be a realistic number between 10 and 100.");
  }
  if (isBlank(fitnessGoal) || String(fitnessGoal).trim().length < 2) {
    errors.push("fitnessGoal is required (e.g. 'Weight Loss', 'Muscle Gain', 'Endurance').");
  }
  if (isBlank(experienceLevel) || String(experienceLevel).trim().length < 2) {
    errors.push("experienceLevel is required (e.g. 'Beginner', 'Intermediate', 'Advanced').");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed.", errors);
  }
  next();
};

const validateAiInsightsInput = (req, res, next) => {
  const { totalWorkouts, averageDuration, caloriesBurned } = req.body || {};
  const errors = [];

  // These fields are optional here - if omitted, the controller will
  // calculate them automatically from the authenticated user's real data.
  if (totalWorkouts !== undefined && (Number.isNaN(Number(totalWorkouts)) || Number(totalWorkouts) < 0)) {
    errors.push("totalWorkouts must be a non-negative number.");
  }
  if (
    averageDuration !== undefined &&
    (Number.isNaN(Number(averageDuration)) || Number(averageDuration) < 0)
  ) {
    errors.push("averageDuration must be a non-negative number.");
  }
  if (
    caloriesBurned !== undefined &&
    (Number.isNaN(Number(caloriesBurned)) || Number(caloriesBurned) < 0)
  ) {
    errors.push("caloriesBurned must be a non-negative number.");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed.", errors);
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateWorkout,
  validateWorkoutUpdate,
  validateObjectId,
  validateAiRecommendationInput,
  validateAiInsightsInput,
};
