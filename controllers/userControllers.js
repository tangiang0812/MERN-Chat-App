const User = require("../models/userModel");
const AsyncHandler = require("express-async-handler");

// const creating user
const registerUser = AsyncHandler(async (req, res) => {
  const { name, email, password, picture } = req.body;

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    res.status(400);
    throw new Error("Email has been used!");
  }
  const user = await User.create({ name, email, password, picture });
  if (user) {
    res.status(201).json(user);
  } else {
    res.status(500);
    throw new Error("Failed to create user");
  }
});

const authUser = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchedPassword(password))) {
    user.status = "online";
    await user.save();
    res.status(200).json(user);
  } else {
    res.status(400);
    throw new Error("Failed to login");
  }
});

module.exports = {
  registerUser,
  authUser,
};
