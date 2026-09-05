import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { getRepoPaths, readLocalConfig, walkFiles } from './repoConfig.js';

// revert <commitID>: restores a previously-pushed commit's snapshot from the
// local prevCommits cache back into commits/, ready to be re-pushed.
// Verifies the commit actually belongs to the repo linked in local config
// before touching anything, and never disturbs .gitGarden itself.
const revertRepo = async (commitID) => {
  const { commitsPath: revertCommitsPath, prevCommitsPath } = getRepoPaths();

  let config;
  try {
    config = await readLocalConfig();
  } catch {
    console.log('Repo is not initialized. Run "init" first.');
    return;
  }
  if (!config.repositoryId) {
    console.log('This repo is not linked to a repository yet.');
    return;
  }

  try {
    const commitDirPath = path.join(prevCommitsPath, commitID);
    const revertCommitDirPath = path.join(revertCommitsPath, commitID);

    if (!fsSync.existsSync(commitDirPath)) {
      console.log(`Commit ${commitID} not found in this repo's push history.`);
      return;
    }

    const commitJsonPath = path.join(commitDirPath, 'commit.json');
    const commits = JSON.parse(await fs.readFile(commitJsonPath, 'utf-8'));
    const commitEntry = commits.find((c) => c.id === commitID);

    if (!commitEntry || commitEntry.repositoryId !== config.repositoryId) {
      console.log(`Commit ${commitID} does not belong to the configured repository.`);
      return;
    }

    if (fsSync.existsSync(revertCommitDirPath)) {
      console.log(`Commit ${commitID} already exists in commits folder. Push it before reverting again.`);
      return;
    }

    await fs.mkdir(revertCommitDirPath, { recursive: true });

    const relativeFiles = await walkFiles(commitDirPath);

    for (const relPath of relativeFiles) {
      const src = path.join(commitDirPath, relPath);
      const dest = path.join(revertCommitDirPath, relPath);
      await fs.mkdir(path.dirname(dest), { recursive: true }); // preserve subfolders

      if (relPath === 'commit.json') {
        const newEntry = { ...commitEntry, operation: 'revert', updatedAt: new Date().toISOString() };
        commits.push(newEntry);
        await fs.writeFile(dest, JSON.stringify(commits, null, 2));
      } else {
        await fs.copyFile(src, dest);
        console.log(`Reverted ${relPath} to commit ${commitID}`);
      }
    }

    await fs.rm(commitDirPath, { recursive: true, force: true });
    console.log(`Commit ${commitID} restored to staging for re-push.`);
  } catch (e) {
    console.log(`Unable to revert commit ${commitID}:`, e);
  }
};

export default revertRepo;
