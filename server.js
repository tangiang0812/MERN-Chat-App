const express = require("express");
const app = express();
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const jwt = require("jsonwebtoken");
const path = require("path");

const rooms = ["general", "tech", "finance", "crypto"];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

require("dotenv").config();
const connectDB = require("./config/connectDB");
const Chat = require("./models/chatModel");
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running");
  });
}

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

io.use((socket, next) => {
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
  socket.on("setup", () => {
    socket.join(socket.decoded.id);
    // console.log(user._id);
    socket.emit("connected");
  });

  socket.on("join-chat", (chat) => {
    socket.join(chat);
    // console.log(`User joined room: ${chat}`);
  });

  socket.on("new-message", async (receivedMessage) => {
    let chat = receivedMessage.chat;
    chat = await Chat.findById(chat);

    if (!chat.users) return console.log("chat.users not defined");

    if (!chat.users.find((user) => user.toString() === socket.decoded.id)) {
      return console.log("User is not a group's member");
    }

    if (socket.decoded.id !== receivedMessage.sender._id) {
      return console.log(
        "Message's sender's ID and socket.decoded.id is not the same"
      );
    }

    chat.users.forEach((user) => {
      io.in(user.toString()).emit("message-received", receivedMessage);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
