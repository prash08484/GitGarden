import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Repository from "../models/repo.model.js";
import Issue from "../models/issue.model.js";

export const signup = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists. login to your account or select a different username.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).send("Server error!");
  }
};

export const getAllUsers = async (req, res) => {
  try {
    res.json(await User.find());
  } catch (err) {
    console.error("Error during user fetching:", err.message);
    res.status(500).send("Server error!");
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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
  const { username, newImage, password, confirmPassword } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (!(await bcrypt.compare(confirmPassword, user.password))) {
      return res.status(401).json({ message: "Invalid account password" });
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (newImage) updateFields.image = newImage;
    if (password) updateFields.password = await bcrypt.hash(password, 10);

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
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

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await User.findByIdAndDelete(req.params.id);
    await Repository.deleteMany({ owner: req.params.id });
    await Issue.deleteMany({ createdBy: req.params.id });

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
