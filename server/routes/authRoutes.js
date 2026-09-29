const express = require("express");
const { register, login, getProfile } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validationMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/profile", protect, getProfile);

module.exports = router;
