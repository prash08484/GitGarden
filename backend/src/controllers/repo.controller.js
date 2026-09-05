import Repository from "../models/repo.model.js";
import User from "../models/user.model.js";
import { fetchRepoFiles } from "./files.controller.js";

export const createRepo = async (req, res) => {
  const { name, description, visibility } = req.body;
  const owner = req.user._id;

  try {
    const repository = await Repository.create({
      name,
      description,
      owner,
      visibility,
    });

    await User.findByIdAndUpdate(owner, {
      $addToSet: { repositories: repository._id },
    });

    res.status(201).json(repository);
  } catch (err) {
    console.error("Error during repository creation:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllRepos = async (req, res) => {
  try {
    const repositories = await Repository.find()
      .populate("owner")
      .populate("issues");

    res.status(200).json(repositories);
  } catch (err) {
    console.error("Error during repository fetching:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const getRepo = async (req, res) => {
  const { userId } = req.params;

  try {
    const repositories = await Repository.find({ owner: userId })
      .populate("owner")
      .populate("issues");

    res.status(200).json({ repositories });
  } catch (err) {
    console.error("Error during user repository fetching:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const fetchRepoByName = async (req, res) => {
  const { name } = req.params;

  try {
    const repository = await Repository.findOne({ name })
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    res.status(200).json(repository);
  } catch (err) {
    console.error("Error during repository fetching:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


export const fetchRepoById = async (req, res) => {
  const { id } = req.params;
  try {
    const repository = await Repository.findById(id).populate("owner").populate("issues");
    if (!repository) return res.status(404).json({ error: "Repository not found" });

    const { files, lastUpdated, commitMsg } = await fetchRepoFiles(repository._id.toString());
    res.status(200).json({ repository, files, lastUpdated, commitMsg });
  } catch (err) {
    console.error("Error during repository fetching:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
 
export const updateRepoById = async (req, res) => {
  const { id } = req.params;
  const { name, description, visibility } = req.body;

  try {
    const repository = await Repository.findByIdAndUpdate(
      id,
      { name, description, visibility },
      { new: true, runValidators: true }
    )
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    res.status(200).json(repository);
  } catch (err) {
    console.error("Error during repository update:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const toggleVisById = async (req, res) => {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    repository.visibility = !repository.visibility;
    await repository.save();

    res.status(200).json(repository);
  } catch (err) {
    console.error("Error during repository visibility update:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteRepoById = async (req, res) => {
  const { id } = req.params;

  try {
    const repository = await Repository.findByIdAndDelete(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    await User.findByIdAndUpdate(repository.owner, {
      $pull: { repositories: repository._id },
    });

    res.status(200).json({ message: "Repository deleted successfully" });
  } catch (err) {
    console.error("Error during repository deletion:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
