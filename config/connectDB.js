const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mern-chat-app";
  mongoose
    .connect(MONGO_URI)
    .then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}`);
    })
    .catch((e) => {
      console.log("Failed to connecto to MongoDB");
      console.log(`Error: ${e}`);
      process.exit(1);
    });
};

module.exports = connectDB;
