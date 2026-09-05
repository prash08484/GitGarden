import Repository from "../models/repo.model.js";
import Issue from "../models/issue.model.js";
import mongoose from "mongoose";

export const authorizeSelf = (paramName = "id") => (req, res, next) => {
  const authenticatedUserId = req.user?._id?.toString();
  const requestedUserId = req.params[paramName];

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (authenticatedUserId !== requestedUserId) {
    return res.status(403).json({
      message: "You can only access your own profile",
    });
  }

  next();
};

export const authorizeRepositoryOwner = async (req, res, next) => {
  try {
    // const repository = await Repository.findById(req.params.id);
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (repository.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Repository access denied" });
    }

    req.repository = repository;
    next();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid repository id" });
    }
    console.error("Repository authorization failed:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const authorizeRepositoryExists = async (req, res, next) => {
  try {
    const repository = await Repository.findById(req.params.repoid ?? req.params.id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    req.repository = repository;
    next();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid repository id" });
    }
    console.error("Repository access validation failed:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const authorizeIssueAccess = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("repository", "owner");
    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    const userId = req.user._id.toString();
    const isCreator = issue.createdBy?.toString() === userId;
    const isRepositoryOwner =
      issue.repository?.owner?.toString() === userId;

    if (!isCreator && !isRepositoryOwner) {
      return res.status(403).json({ message: "Issue access denied" });
    }

    req.issue = issue;
    next();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid issue id" });
    }
    console.error("Issue authorization failed:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const authorizeOwner = (getOwnerId) => (req, res, next) => {
  const authenticatedUserId = req.user?._id?.toString();
  const ownerId = getOwnerId(req)?.toString();

  if (!authenticatedUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!ownerId || authenticatedUserId !== ownerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

export default authorizeSelf;