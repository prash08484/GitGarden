import path from "path";
import mongoose from "mongoose";

export class InvalidPathError extends Error {}

export const sanitizeRelativePath = (relativePath) => {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new InvalidPathError("Path is required");
  }

  const normalized = path.posix.normalize(relativePath.replace(/\\/g, "/"));

  if (
    normalized.startsWith("/") ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.includes("/../")
  ) {
    throw new InvalidPathError("Invalid path");
  }

  return normalized;
};

export const buildRepoFileKey = (repositoryId, relativePath) => {
  if (!mongoose.Types.ObjectId.isValid(repositoryId)) {
    throw new InvalidPathError("Invalid repository id");
  }
  const safePath = sanitizeRelativePath(relativePath);
  return `repositories/${repositoryId}/${safePath}`;
};

// Defense-in-depth: confirm a key actually belongs to the claimed repo
export const assertKeyBelongsToRepo = (key, repositoryId) => {
  const expectedPrefix = `repositories/${repositoryId}/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new InvalidPathError("Repository id / path mismatch");
  }
};