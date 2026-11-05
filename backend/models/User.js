import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIat) {
  if (!this.passwordChangedAt) return false;
  const changedAtSec = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedAtSec > jwtIat;
};

const User = mongoose.model("User", userSchema);

export default User;
