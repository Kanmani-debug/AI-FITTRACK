const Workout = require("../models/Workout");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * @route   POST /api/workouts
 * @access  Private
 */
const createWorkout = async (req, res, next) => {
  try {
    const { workoutName, category, duration, caloriesBurned, workoutDate } = req.body;

    const workout = await Workout.create({
      user: req.user._id, // never trust a client-provided user id
      workoutName: String(workoutName).trim(),
      category: String(category).trim(),
      duration: Number(duration),
      caloriesBurned: Number(caloriesBurned),
      workoutDate: new Date(workoutDate),
    });

    return sendSuccess(res, 201, "Workout created successfully.", { workout });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts
 * @access  Private
 * Supports optional pagination via ?page=&limit=
 */
const getWorkouts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [workouts, total] = await Promise.all([
      Workout.find({ user: req.user._id })
        .sort({ workoutDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Workout.countDocuments({ user: req.user._id }),
    ]);

    return sendSuccess(res, 200, "Workouts fetched successfully.", {
      workouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts/search?query=&category=&date=
 * @access  Private
 */
const searchWorkouts = async (req, res, next) => {
  try {
    const { query, category, date } = req.query;

    const filter = { user: req.user._id };

    if (query && String(query).trim() !== "") {
      const regex = new RegExp(String(query).trim(), "i"); // partial, case-insensitive
      filter.$or = [{ workoutName: regex }, { category: regex }];
    }

    if (category && String(category).trim() !== "") {
      filter.category = new RegExp(`^${String(category).trim()}$`, "i");
    }

    if (date && !Number.isNaN(Date.parse(date))) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.workoutDate = { $gte: start, $lte: end };
    }

    const workouts = await Workout.find(filter).sort({ workoutDate: -1 });

    return sendSuccess(res, 200, `Found ${workouts.length} matching workout(s).`, { workouts });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts/statistics
 * @access  Private
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await Workout.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          averageDuration: { $avg: "$duration" },
          totalCaloriesBurned: { $sum: "$caloriesBurned" },
          totalDuration: { $sum: "$duration" },
        },
      },
    ]);

    const categoryBreakdown = await Workout.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const result = stats[0] || {
      totalWorkouts: 0,
      averageDuration: 0,
      totalCaloriesBurned: 0,
      totalDuration: 0,
    };

    return sendSuccess(res, 200, "Statistics calculated successfully.", {
      totalWorkouts: result.totalWorkouts,
      averageDuration: Math.round((result.averageDuration || 0) * 10) / 10,
      totalCaloriesBurned: result.totalCaloriesBurned,
      totalDuration: result.totalDuration,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        count: c.count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workouts/:id
 * @access  Private
 */
const getWorkoutById = async (req, res, next) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return sendError(res, 404, "Workout not found.");
    }
    if (!workout.user.equals(req.user._id)) {
      return sendError(res, 403, "You are not authorized to access this workout.");
    }

    return sendSuccess(res, 200, "Workout fetched successfully.", { workout });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/workouts/:id
 * @access  Private
 */
const updateWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return sendError(res, 404, "Workout not found.");
    }
    if (!workout.user.equals(req.user._id)) {
      return sendError(res, 403, "You are not authorized to update this workout.");
    }

    const allowedFields = ["workoutName", "category", "duration", "caloriesBurned", "workoutDate"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        workout[field] = field === "workoutDate" ? new Date(req.body[field]) : req.body[field];
      }
    });

    await workout.save(); // triggers Mongoose validation

    return sendSuccess(res, 200, "Workout updated successfully.", { workout });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/workouts/:id
 * @access  Private
 */
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return sendError(res, 404, "Workout not found.");
    }
    if (!workout.user.equals(req.user._id)) {
      return sendError(res, 403, "You are not authorized to delete this workout.");
    }

    await workout.deleteOne();

    return sendSuccess(res, 200, "Workout deleted successfully.");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkout,
  getWorkouts,
  searchWorkouts,
  getStatistics,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};
