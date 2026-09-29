const express = require("express");
const {
  createWorkout,
  getWorkouts,
  searchWorkouts,
  getStatistics,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");
const {
  validateWorkout,
  validateWorkoutUpdate,
  validateObjectId,
} = require("../middleware/validationMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All workout routes require authentication
router.use(protect);

// IMPORTANT: specific routes must come before the "/:id" route,
// otherwise "search" or "statistics" would be treated as an ObjectId.
router.get("/search", searchWorkouts);
router.get("/statistics", getStatistics);

router.post("/", validateWorkout, createWorkout);
router.get("/", getWorkouts);
router.get("/:id", validateObjectId("id"), getWorkoutById);
router.put("/:id", validateObjectId("id"), validateWorkoutUpdate, updateWorkout);
router.delete("/:id", validateObjectId("id"), deleteWorkout);

module.exports = router;
