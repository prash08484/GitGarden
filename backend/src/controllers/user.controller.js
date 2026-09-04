import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId as ObjectId } from "mongodb";
import Repository from "../models/repo.model.js";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGODB_URI;
let client;

async function connectClient() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
}

export const signup = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: "User already exists. login to your account or select a different username." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email,
      password: hashedPass,
      repositories: [],
      followedUsers: [],
      starRepositories: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );
    res.json({ token, userId: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during login : ", err.message);
    res.status(500).send("Server error!");
  }
};

export const getAllUsers = async (req, res) => {
  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
};

export const getUserProfile = async (req, res) => {
  const currentID = req.params.id;

  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(currentID),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.send(user);
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
};

export const updateUserProfile = async (req, res) => {
  const currentID = req.params.id;
  const { username, newImage, password, confirmPassword } = req.body;

  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(currentID) });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const isMatch = await bcrypt.compare(confirmPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid account password" });
    }

    let updateFields = {};

    if (username) {
      updateFields.username = username;
    }
    
    if (newImage) {
      updateFields.image = newImage;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(currentID) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    res.json({ message: "User updated successfully", user: result });
  } catch (err) {
    console.error("Error during updating:", err.message);
    res.status(500).send("Server error!");
  }
};

export const deleteUserProfile = async (req, res) => {
  const currentID = req.params.id;
  const { password } = req.body;

  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");
    const reposCollection = db.collection("repositories");
    const issuesCollection = db.collection("issues");

    const user = await usersCollection.findOne({ _id: new ObjectId(currentID) });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await usersCollection.deleteOne({_id: new ObjectId(currentID)});
    await reposCollection.deleteMany({owner: new ObjectId(currentID)});
    await issuesCollection.deleteMany({createdBy: new ObjectId(currentID)});

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during deletion : ", err.message);
    res.status(500).send("Server error!");
  }
};

export const starRepository = async (req, res) => {
  const { repoid } = req.params;
  const { userId } = req.body;

  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { starRepositories: new ObjectId(repoid) } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Repo starred successfully!" });
    } else {
      res.status(400).json({ message: "Repo already starred or user not found." });
    }
  } catch (err) {
    console.error("Error starring repo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unstarRepository = async (req, res) => {
  const { repoid } = req.params;
  const { userId } = req.body;

  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { starRepositories: new ObjectId(repoid) } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Repo unstarred successfully!" });
    } else {
      res.status(400).json({ message: "Repo not starred or user not found." });
    }
  } catch (err) {
    console.error("Error unstarring repo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchStarRepos = async (req, res) => {
  const { id } = req.params;

  try {
    await connectClient();
    const db = client.db("repoDoc");
    const usersCollection = db.collection("users");
    const reposCollection = db.collection("repositories");

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const starRepos = user.starRepositories || [];

    const repos = await Promise.all(
      starRepos.map(async (repoid) => {
        try {
          const repository = await reposCollection.findOne({ _id: new ObjectId(repoid) });
          return repository;
        } catch (err) {
          console.error("Error fetching repository:", err.message);
          return null;
        }
      })
    );

    const validRepos = repos.filter(Boolean);

    res.send(validRepos);
  } catch (err) {
    console.error("Error during fetching:", err.message);
    res.status(500).send("Server error!");
  }
};
