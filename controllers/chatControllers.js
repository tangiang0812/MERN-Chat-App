const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const { create } = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name picture email",
      },
    });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);

      const fullChat = await createdChat.populate("users", "-password");

      res.status(200).send(fullChat);
    } catch (e) {
      res.status(400);
      throw new Error(e.message);
    }
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name picture email",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (e) {
    res.status(400);
    throw new Error(e.message);
  }
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  const users = req.body.users;

  if (users.length < 2) {
    return res.status(400).json({ message: "More the 2 users are required" });
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (e) {
    res.status(400);
    throw new Error("Can not create group chat");
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(updatedChat);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $addToSet: { users: { $each: userId } },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(updatedChat);
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  console.log(userId);
  console.log(req.user._id);

  let updatedChat = await Chat.findById(chatId);

  if (!updatedChat) {
    res.status(400);
    throw new Error("Chat not found");
  }

  if (userId === updatedChat.groupAdmin.toString()) {
    res.status(400);
    throw new Error("Admin can not leave group");
  }

  if (
    req.user._id.toString() === updatedChat.groupAdmin.toString() ||
    req.user._id.toString() === userId
  ) {
    updatedChat.users = updatedChat.users.filter(
      (user) => user._id.toString() !== userId
    );

    await updatedChat.save();

    updatedChat = await updatedChat.populate("users", "-password");
    updatedChat = await updatedChat.populate("groupAdmin", "-password");

    res.status(200).json(updatedChat);
  }

  // const updatedChat = await Chat.findByIdAndUpdate(
  //   chatId,
  //   {
  //     $pull: { users: userId },
  //   },
  //   { new: true }
  // )
  //   .populate("users", "-password")
  //   .populate("groupAdmin", "-password");

  // if (!updatedChat) {
  //   res.status(404);
  //   throw new Error("Chat not found");
  // } else {
  //   res.json(updatedChat);
  // }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
