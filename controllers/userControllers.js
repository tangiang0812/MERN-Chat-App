const User = require("../models/userModel");
const AsyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");

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
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      status: user.status,
      token: generateToken(user._id),
    });
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
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      status: user.status,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to login");
  }
});

const logoutUser = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.status = "offline";
  await user.save();
  res.status(200).send();
});

const searchUsers = AsyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.status(200).json(users);
});

module.exports = {
  registerUser,
  authUser,
  logoutUser,
  searchUsers,
};
