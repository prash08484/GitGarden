import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Repository from "../models/repo.model.js";
import Issue from "../models/issue.model.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  image: user.image,
});

const isDuplicateKeyError = (err) => err?.code === 11000;

const getAuthenticatedUserId = (req) => {
  if (req.user?.id) {
    return req.user.id.toString();
  }

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length);
  const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return typeof payload === "object" && payload?.id
    ? payload.id.toString()
    : null;
};

export const signup = async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!username || !email || !emailPattern.test(email) || !password) {
    return res.status(400).json({
      message: "Username, valid email, and password are required",
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(409).json({
        message: "Username or email is already in use",
      });
    }

    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      userId: user._id,
      user: publicUser(user),
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({
        message: "Username or email is already in use",
      });
    }

    console.error("Error during signup:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      userId: user._id,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).send("Server error!");
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error during user fetching:", err.message);
    res.status(500).send("Server error!");
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error during profile fetching:", err.message);
    res.status(500).send("Server error!");
  }
};

export const updateUserProfile = async (req, res) => {
  const {
    username,
    image,
    newImage,
    password,
    confirmPassword,
  } = req.body;

  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (authenticatedUserId !== req.params.id) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (!confirmPassword || !(await bcrypt.compare(confirmPassword, user.password))) {
      return res.status(401).json({ message: "Invalid account password" });
    }

    const updateFields = {};
    if (username !== undefined) {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        return res.status(400).json({ message: "Username cannot be empty" });
      }
      updateFields.username = trimmedUsername;
    }
    if (image !== undefined || newImage !== undefined) {
      updateFields.image = image ?? newImage;
    }
    if (password !== undefined) {
      if (!password) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      message: "User updated successfully",
      user: publicUser(updatedUser),
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: "Username or email is already in use" });
    }

    console.error("Error during user update:", err.message);
    res.status(500).send("Server error!");
  }
};

export const deleteUserProfile = async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (!password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    await Repository.deleteMany({ owner: deletedUser._id });
    await Issue.deleteMany({ createdBy: deletedUser._id });

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during user deletion:", err.message);
    res.status(500).send("Server error!");
  }
};

export const starRepository = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.body.userId,
      { $addToSet: { starRepositories: req.params.repoid } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Repo starred successfully!" });
  } catch (err) {
    console.error("Error starring repo:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unstarRepository = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.body.userId,
      { $pull: { starRepositories: req.params.repoid } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Repo unstarred successfully!" });
  } catch (err) {
    console.error("Error unstarring repo:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchStarRepos = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("starRepositories");
    if (!user) {
      return res.status(404).send("User not found");
    }

    res.json(user.starRepositories);
  } catch (err) {
    console.error("Error during starred repository fetching:", err.message);
    res.status(500).send("Server error!");
  }
};
