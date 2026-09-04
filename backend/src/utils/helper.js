import User from "../models/user.model.js";
import Repository from "../models/repo.model.js";

export const isUserVerified = async (username) => {
  try {
    const userExists = Boolean(await User.exists({ username }));

    return userExists;
  } catch (e) {
    console.error("Error while verifying:", e);
    return false;
  }
};

export const isRepoVerified = async (repoName) => {
  try {
    const repoExists = Boolean(await Repository.exists({ name: repoName }));

    return repoExists;
  } catch (e) {
    console.error("Error while verifying:", e);
    return false;
  }
};
