import { buildRepoFileKey, assertKeyBelongsToRepo, InvalidPathError } from "../utils/s3Key.js";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import { v4 as uuidv4 } from 'uuid'; 

export const fetchRepoFiles = async (repositoryId) => {
  const prefix = `repositories/${repositoryId}/`;
  try {
    const data = await s3.listObjectsV2({ Bucket: S3_BUCKET, Prefix: prefix }).promise();

    const files = (data.Contents || [])
      .filter(item => item.Key !== `${prefix}commit.json`)
      .map(item => ({
        path: item.Key.slice(prefix.length), // "src/routes/weather.js", not just the basename
        type: "file",
        size: item.Size,
        lastModified: item.LastModified,
      }));

    const commitFile = (data.Contents || []).find(item => item.Key === `${prefix}commit.json`);
    let lastUpdated, commitMsg;
    if (commitFile) {
      const commitData = await s3.getObject({ Bucket: S3_BUCKET, Key: `${prefix}commit.json` }).promise();
      const commits = JSON.parse(commitData.Body.toString("utf-8"));
      lastUpdated = commits.at(-1)?.updatedAt;
      commitMsg = commits.at(-1)?.message;
    }
    return { files, lastUpdated, commitMsg };
  } catch (err) {
    console.error("Error fetching repo files:", err);
    return { files: [], lastUpdated: null, commitMsg: null };
  }
};


export const fetchRepoFileContent = async (req, res) => {
  const { repositoryId, path: relativePath } = req.query;

  let key;
  try {
    key = buildRepoFileKey(repositoryId, relativePath);
  } catch (err) {
    if (err instanceof InvalidPathError) return res.status(400).json({ error: err.message });
    throw err;
  }

  try {
    const data = await s3.getObject({ Bucket: S3_BUCKET, Key: key }).promise();
    res.json({ content: data.Body.toString("utf-8") });
  } catch (err) {
    console.error("Error fetching file content:", err);
    res.status(500).json({ error: "Failed to fetch file content" });
  }
};

export const updateRepoFileContent = async (req, res) => {
  try {
    const { id: repositoryId } = req.params;
    const { path: relativePath, content, commitName } = req.body;

    const key = buildRepoFileKey(repositoryId, relativePath); // throws on bad path
    assertKeyBelongsToRepo(key, repositoryId);                // defense-in-depth: file really belongs to this repo

    // Write the actual file content FIRST — this is the artifact that matters.
    await s3.putObject({
      Bucket: S3_BUCKET,
      Key: key,
      Body: content,
      ContentType: "text/plain",
    }).promise();

    // Only record commit metadata once the write above has actually succeeded,
    // so the commit log never claims a change that didn't happen.
    const commitKey = `repositories/${repositoryId}/commit.json`;
    let commitData = [];
    try {
      const commitFile = await s3.getObject({ Bucket: S3_BUCKET, Key: commitKey }).promise();
      commitData = JSON.parse(commitFile.Body.toString("utf-8"));
    } catch (err) {
      if (err.code !== "NoSuchKey") throw err; // real S3 error, don't swallow it
      // no commit.json yet for this repo — start a fresh history instead of 500ing
    }

    commitData.push({
      id: uuidv4(),
      operation: "push",
      message: commitName,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id, // authenticated user, never trusted from the body
      OperationFiles: [relativePath],
    });

    await s3.putObject({
      Bucket: S3_BUCKET,
      Key: commitKey,
      Body: JSON.stringify(commitData),
      ContentType: "application/json",
    }).promise();

    res.json({ message: "File updated successfully" });
  } catch (err) {
    if (err instanceof InvalidPathError) return res.status(400).json({ error: err.message });
    console.error("Error updating file:", err);
    res.status(500).json({ error: "Error updating file" });
  }
};