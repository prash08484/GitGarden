import fs from 'fs/promises';
import path from 'path';
import { getRepoPaths, walkFiles, readLocalConfig } from './repoConfig.js';

const API_BASE_URL = process.env.GITGARDEN_API_URL || 'http://localhost:5000';

// The CLI no longer talks to S3 (or Mongo) directly — it hands the commit
// off to the backend over HTTP. The backend-side /api/repo/push route/controller
// that actually receives this and writes to S3 doesn't exist yet; this is the
// client half of that contract, ready to be wired up.
const sendPushToBackend = async (repositoryId, commitPayload) => {
  const res = await fetch(`${API_BASE_URL}/api/repo/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repositoryId, commit: commitPayload }),
  });

  if (!res.ok) {
    throw new Error(`Backend responded with ${res.status}`);
  }
  return res.json();
};

// push: sends every locally committed (not-yet-pushed) commit to the backend,
// oldest first, identified only by the repositoryId stored in local config.
const pushRepo = async () => {
  const { commitsPath, prevCommitsPath } = getRepoPaths();

  let config;
  try {
    config = await readLocalConfig();
  } catch {
    console.log('Repo is not initialized. Run "init" first.');
    return;
  }

  if (!config.repositoryId) {
    console.log('This repo is not linked to a repository yet. Re-run "init <repositoryId>".');
    return;
  }
  const { repositoryId } = config;

  try {
    await fs.mkdir(prevCommitsPath, { recursive: true });
    const dirs = await fs.readdir(commitsPath);

    if (dirs.length === 0) {
      console.log('No commits to push.');
      return;
    }

    const dirsWithTimestamp = await Promise.all(
      dirs.map(async (dir) => {
        const commitFilePath = path.join(commitsPath, dir, 'commit.json');
        const commitData = JSON.parse(await fs.readFile(commitFilePath, 'utf-8'));
        const entry = commitData.find((c) => c.id === dir);
        return { dir, createdAt: entry?.createdAt ?? null };
      })
    );
    dirsWithTimestamp.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const { dir } of dirsWithTimestamp) {
      const dirPath = path.join(commitsPath, dir);
      const commitFilePath = path.join(dirPath, 'commit.json');
      const commitData = JSON.parse(await fs.readFile(commitFilePath, 'utf-8'));
      const commitEntry = commitData.find((c) => c.id === dir) ?? {};

      if (commitEntry.repositoryId && commitEntry.repositoryId !== repositoryId) {
        console.log(`Skipping commit ${dir}: belongs to a different repository.`);
        continue;
      }

      const relativeFiles = await walkFiles(dirPath);
      const files = [];
      for (const relPath of relativeFiles) {
        if (relPath === 'commit.json') continue;
        const content = await fs.readFile(path.join(dirPath, relPath), 'utf-8');
        files.push({ relPath, content });
      }

      try {
        await sendPushToBackend(repositoryId, { ...commitEntry, files });
      } catch (apiErr) {
        console.error(`Could not push commit ${dir} yet (${apiErr.message}). Leaving it staged locally so nothing is lost.`);
        continue;
      }

      const newEntry = { ...commitEntry, operation: 'push', updatedAt: new Date().toISOString() };
      commitData.push(newEntry);
      await fs.writeFile(commitFilePath, JSON.stringify(commitData, null, 2));

      const prevCommitDirPath = path.join(prevCommitsPath, dir);
      await fs.mkdir(prevCommitDirPath, { recursive: true });

      for (const relPath of relativeFiles) {
        const src = path.join(dirPath, relPath);
        const dest = path.join(prevCommitDirPath, relPath);
        await fs.mkdir(path.dirname(dest), { recursive: true }); // preserve subfolders locally too
        await fs.copyFile(src, dest);
      }

      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`Pushed commit ${dir}.`);
    }
  } catch (e) {
    console.log('Error pushing commits:', e);
  }
};

export default pushRepo;
