const express = require("express");

const {
  fetchMessages,
  sendMessage,
} = require("../controllers/messageControllers");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, fetchMessages);
router.route("/").post(protect, sendMessage);

module.exports = router;
