const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");

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
  const keyword = req.params.chatId
    ? {
        $and: [
          {
            users: {
              $elemMatch: { $eq: req.user._id },
            },
          },
          {
            _id: { $eq: req.params.chatId },
          },
        ],
      }
    : {
        users: {
          $elemMatch: { $eq: req.user._id },
        },
      };
  try {
    const chats = await Chat.find(keyword)
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

  let updatedChat = await Chat.findById(chatId);

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!updatedChat.users) {
    res.status(400);
    throw new Error("chat.users not defined");
  }

  if (
    !updatedChat.users.find(
      (user) => user.toString() === req.user._id.toString()
    )
  ) {
    res.status(400);
    throw new Error("You are not a group's member");
  }

  updatedChat.chatName = chatName;
  await updatedChat.save();

  updatedChat = await updatedChat.populate("users", "-password");
  updatedChat = await updatedChat.populate("groupAdmin", "-password");
  updatedChat = await updatedChat.populate({
    path: "latestMessage",
    populate: {
      path: "sender",
      select: "name picture email",
    },
  });

  res.status(200).json(updatedChat);
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  let updatedChat = await Chat.findById(chatId);

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (!updatedChat.users) {
    res.status(400);
    throw new Error("chat.users not defined");
  }

  if (
    !updatedChat.users.find(
      (user) => user.toString() === req.user._id.toString()
    )
  ) {
    res.status(400);
    throw new Error("You are not a group's member");
  }

  for (let u of userId) {
    if (!updatedChat.users.find((user) => user._id.toString() === u)) {
      updatedChat.users.push(u);
    }
  }

  await updatedChat.save();

  console.log(updatedChat);

  updatedChat = await updatedChat.populate("users", "-password");
  updatedChat = await updatedChat.populate("groupAdmin", "-password");
  updatedChat = await updatedChat.populate({
    path: "latestMessage",
    populate: {
      path: "sender",
      select: "name picture email",
    },
  });

  res.status(200).json(updatedChat);
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

  if (!updatedChat.users) {
    res.status(400);
    throw new Error("chat.users not defined");
  }

  if (
    !updatedChat.users.find(
      (user) => user.toString() === req.user._id.toString()
    )
  ) {
    res.status(400);
    throw new Error("You are not a group's member");
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
    updatedChat = await updatedChat.populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name picture email",
      },
    });

    res.status(200).json(updatedChat);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
