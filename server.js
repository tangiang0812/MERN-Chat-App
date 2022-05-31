const express = require("express");
const app = express();
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const jwt = require("jsonwebtoken");

const rooms = ["general", "tech", "finance", "crypto"];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

require("dotenv").config();
const connectDB = require("./config/connectDB");
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.use(function (socket, next) {
  // console.log(socket);
  if (socket.handshake.auth && socket.handshake.auth.token) {
    // console.log(socket.handshake.auth);
    jwt.verify(
      socket.handshake.auth.token,
      process.env.JWT_SECRET,
      function (err, decoded) {
        if (err) return next(new Error("Authentication error"));
        // console.log("authentication success");
        socket.decoded = decoded;
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", (socket) => {
  socket.on("setup", (user) => {
    socket.join(user._id);
    console.log(user._id);
    socket.emit("connected");
  });

  socket.on("join-chat", (chat) => {
    socket.join(chat);
    console.log(`User joined room: ${chat}`);
  });

  socket.on("new-message", (receivedMessage) => {
    const chat = receivedMessage.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == receivedMessage.sender._id) return;
      socket.in(user._id).emit("message-received", receivedMessage);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
