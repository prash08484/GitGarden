import fs from 'fs/promises';
import { getRepoPaths, repoExists } from './repoConfig.js';

// init: creates .gitGarden with config.json, commits/, and staging/.
// Optionally links the repo immediately by storing repositoryId (needed later by push/revert).
const initRepo = async (repositoryId = null) => {
  if (repoExists()) {
    console.warn('Repository already initialized.');
    return;
  }

  const { repoPath, commitsPath, stagingPath, configPath } = getRepoPaths();

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });
    await fs.mkdir(stagingPath, { recursive: true });

    await fs.writeFile(
      configPath,
      JSON.stringify(
        {
          repositoryId: repositoryId ?? null,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log('Repository initialized successfully.');
    if (!repositoryId) {
      console.log('No repositoryId provided — run "init <repositoryId>" again once the repo exists on the server, before pushing.');
    }
  } catch (e) {
    console.error('Error initializing repository:', e);
  }
};

export default initRepo;
