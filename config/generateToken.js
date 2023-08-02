const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "supersecuresecret", {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
