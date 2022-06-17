const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const fetchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await Message.find({ chat: chatId }).populate(
      "sender",
      "name picture"
    );
    // .populate("chat");
    res.status(200).json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat.users.find((u) => req.user._id.toString() === u._id.toString())) {
      res.status(400);
      throw new Error("You are not a member of this group chat");
    }

    let message = await Message.create({
      sender: req.user._id,
      content: content,
      chat: chatId,
    });

    chat.latestMessage = message;
    await chat.save();

    message = await message.populate("sender", "name picture email");
    // message = await message.populate({
    //   path: "chat",
    //   populate: {
    //     path: "users",
    //     select: "name picture email",
    //   },
    // });

    res.status(200).json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { fetchMessages, sendMessage };
