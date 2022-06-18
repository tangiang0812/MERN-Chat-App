const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Can't be blank"],
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "Can't be blank"],
      index: true,
      validate: [isEmail, " Invalid email address"],
    },
    password: {
      type: String,
      required: [true, "Can't be blank"],
    },
    picture: {
      type: String,
      required: true,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    newMessages: [
      {
        type: Object,
      },
    ],
    status: {
      type: String,
      default: "offline",
    },
  },
  { minimize: false, timestamps: true }
);

userSchema.methods.matchedPassword = async function (enteredPassword) {
  const result = await bcrypt.compare(enteredPassword, this.password);
  // console.log(result);
  return result;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
