import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getRepoPaths, walkFiles, readLocalConfig } from './repoConfig.js';

// commit <msg>: snapshots everything currently staged, preserving directory
// structure, then clears staging. Refuses to create an empty commit.
const commitRepo = async (msg) => {
  const { commitsPath, stagingPath } = getRepoPaths();

  try {
    const stagedFiles = await walkFiles(stagingPath);

    if (stagedFiles.length === 0) {
      console.error('Nothing staged to commit. Use "add" first.');
      return;
    }

    const config = await readLocalConfig().catch(() => ({ repositoryId: null }));

    const commitID = uuidv4();
    const commitDir = path.join(commitsPath, commitID);
    await fs.mkdir(commitDir, { recursive: true });

    const now = new Date().toISOString();
    const metadata = {
      id: commitID,
      repositoryId: config.repositoryId ?? null,
      operation: 'commit',
      message: msg,
      createdAt: now,   // immutable: when the commit was made
      updatedAt: now,   // bumped on push/pull/revert operations
      OperationFiles: stagedFiles,
    };

    await fs.writeFile(path.join(commitDir, 'commit.json'), JSON.stringify([metadata], null, 2));

    for (const relPath of stagedFiles) {
      const dest = path.join(commitDir, relPath);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(path.join(stagingPath, relPath), dest);
    }

    // Clear staging fully (recursive), not just the top-level files, since
    // staged content can now include nested directories.
    await fs.rm(stagingPath, { recursive: true, force: true });
    await fs.mkdir(stagingPath, { recursive: true });

    console.log(`Commit ${commitID} created with message: "${msg}"`);
  } catch (e) {
    console.error('Error committing files:', e);
  }
};

export default commitRepo;
