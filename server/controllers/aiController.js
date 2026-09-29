const Workout = require("../models/Workout");
const { generateStructuredContent, checkGeminiHealth } = require("../services/geminiService");
const { sendSuccess } = require("../utils/response");

const AI_SAFETY_INSTRUCTION = `You are a certified fitness coaching assistant embedded in a fitness tracking app called AI FitTrack.
Rules you must always follow:
- You are NOT a doctor and must never diagnose medical conditions or claim to be a medical professional.
- Never recommend anything that could be dangerous or unsafe for a general audience.
- Always include general safety considerations (warm-up, hydration, proper form, rest, listening to one's body).
- Where relevant, encourage the user to consult a doctor or certified professional before starting a new or intense exercise program, especially if they mention pain, injury, or a medical condition.
- Keep guidance practical, structured, and encouraging.
- Respond ONLY with valid JSON matching the exact schema requested in the user prompt. Do not include markdown, commentary, or text outside the JSON object.`;

/**
 * @route   POST /api/ai/recommendation
 * @access  Private
 */
const getWorkoutRecommendation = async (req, res, next) => {
  try {
    const { age, fitnessGoal, experienceLevel } = req.body;

    const prompt = `Generate a personalized fitness plan for the following user, and respond with ONLY a JSON object using exactly this schema:
{
  "workoutPlan": { "overview": string, "durationWeeks": number },
  "weeklySchedule": [ { "day": string, "focus": string, "exercises": [string] } ],
  "suitableExercises": [string],
  "trainingTips": [string],
  "safetyRecommendations": [string],
  "motivationalMessage": string,
  "disclaimer": string
}

User profile:
- Age: ${age}
- Fitness goal: ${fitnessGoal}
- Experience level: ${experienceLevel}

The "disclaimer" field must clearly state this is general fitness guidance, not medical advice, and that the user should consult a professional if they have health concerns.`;

    const aiResponse = await generateStructuredContent(AI_SAFETY_INSTRUCTION, prompt);

    return sendSuccess(res, 200, "AI workout recommendation generated successfully.", {
      input: { age, fitnessGoal, experienceLevel },
      recommendation: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai/insights
 * @access  Private
 *
 * If the request body omits totalWorkouts/averageDuration/caloriesBurned,
 * these are calculated automatically from the authenticated user's real
 * MongoDB workout records instead of requiring the client to compute them.
 */
const getFitnessInsights = async (req, res, next) => {
  try {
    let { totalWorkouts, averageDuration, caloriesBurned } = req.body;
    let source = "user-provided";

    const needsAutoCalculation =
      totalWorkouts === undefined || averageDuration === undefined || caloriesBurned === undefined;

    if (needsAutoCalculation) {
      source = "calculated-from-database";
      const stats = await Workout.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalWorkouts: { $sum: 1 },
            averageDuration: { $avg: "$duration" },
            caloriesBurned: { $sum: "$caloriesBurned" },
          },
        },
      ]);

      const result = stats[0] || { totalWorkouts: 0, averageDuration: 0, caloriesBurned: 0 };
      totalWorkouts = result.totalWorkouts;
      averageDuration = Math.round((result.averageDuration || 0) * 10) / 10;
      caloriesBurned = result.caloriesBurned;
    }

    const prompt = `Analyze the following real fitness activity statistics for a user and respond with ONLY a JSON object using exactly this schema:
{
  "performanceAnalysis": string,
  "improvementSuggestions": [string],
  "motivationalAdvice": string,
  "progressSummary": string,
  "disclaimer": string
}

User statistics:
- Total workouts logged: ${totalWorkouts}
- Average workout duration (minutes): ${averageDuration}
- Total calories burned: ${caloriesBurned}

The "disclaimer" field must clearly state this is general fitness guidance, not medical advice.`;

    const aiResponse = await generateStructuredContent(AI_SAFETY_INSTRUCTION, prompt);

    return sendSuccess(res, 200, "AI fitness insights generated successfully.", {
      statsUsed: { totalWorkouts, averageDuration, caloriesBurned, source },
      insights: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/health
 * @access  Private
 *
 * Reports whether Gemini is configured and, if a key is present, makes one
 * cheap live call to confirm the model/key/network actually work. Never
 * exposes the API key.
 */
const getAiHealth = async (req, res, next) => {
  try {
    const gemini = await checkGeminiHealth();
    return sendSuccess(res, 200, "Gemini configuration/connectivity check complete.", { gemini });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkoutRecommendation, getFitnessInsights, getAiHealth };
