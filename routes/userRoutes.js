const express = require("express");
const { registerUser, authUser } = require("../controllers/userControllers");
const router = express.Router();

//creating user
router.post("/", registerUser);
router.post("/login", authUser);

module.exports = router;
