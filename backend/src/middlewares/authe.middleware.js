import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const unauthorized = (res, message = "Authentication required") =>
  res.status(401).json({ message });

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return unauthorized(res);
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return unauthorized(res, "Invalid authentication token");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = payload?.id;

    if (
      typeof userId !== "string" ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return unauthorized(res, "Invalid authentication token");
    }

    const user = await User.findById(userId);
    if (!user) {
      return unauthorized(res, "User no longer exists");
    }

    req.user = user;
    next();
  } catch (err) {
    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError" ||
      err.name === "CastError"
    ) {
      return unauthorized(res, "Invalid authentication token");
    }

    console.error("Authentication lookup failed:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export default authenticate;