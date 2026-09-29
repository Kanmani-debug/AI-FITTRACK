const express = require("express");
const {
  getWorkoutRecommendation,
  getFitnessInsights,
  getAiHealth,
} = require("../controllers/aiController");
const {
  validateAiRecommendationInput,
  validateAiInsightsInput,
} = require("../middleware/validationMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/health", getAiHealth);
router.post("/recommendation", validateAiRecommendationInput, getWorkoutRecommendation);
router.post("/insights", validateAiInsightsInput, getFitnessInsights);

module.exports = router;
