const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  authUser,
  logoutUser,
} = require("../controllers/userControllers");
const router = express.Router();

//creating user
router.post("/", registerUser);
router.post("/login", authUser);
router.delete("/logout", protect, logoutUser);

module.exports = router;
