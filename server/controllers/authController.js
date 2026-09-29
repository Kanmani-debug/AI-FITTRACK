const User = require("../models/User");
const { hashPassword, comparePassword } = require("../services/passwordService");
const { generateToken } = require("../services/jwtService");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const name = String(req.body.name).trim();
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, "An account with this email already exists.");
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    return sendSuccess(res, 201, "User registered successfully.", {
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, "Login successful.", {
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user is attached by the auth middleware
    return sendSuccess(res, 200, "Profile fetched successfully.", {
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };
