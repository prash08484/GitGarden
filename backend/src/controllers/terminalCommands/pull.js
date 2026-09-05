import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { s3, S3_BUCKET } from '../../config/aws-config.js';
import { getRepoPaths, readLocalConfig, isExcluded } from './repoConfig.js';
import { assertKeyBelongsToRepo } from '../../utils/s3Key.js';

// pull: fetches the repository's stored files by repositoryId (from local
// config), preserving directory structure, and never touches .gitGarden.
// If a local file differs from the incoming version, it's backed up rather
// than silently overwritten.
const pullRepo = async () => {
  const { repoPath } = getRepoPaths();

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
  const prefix = `repositories/${repositoryId}/`;

  try {
    const pullId = uuidv4();
    const data = await s3.listObjectsV2({ Bucket: S3_BUCKET, Prefix: prefix }).promise();

    if (!data.Contents || data.Contents.length === 0) {
      console.log('No files found for this repository.');
      return;
    }

    const pulledFiles = [];

    for (const obj of data.Contents) {
      assertKeyBelongsToRepo(obj.Key, repositoryId);
      const relPath = obj.Key.slice(prefix.length);

      // Defense-in-depth: never let a pulled key land inside .gitGarden,
      // node_modules, or overwrite a local .env.
      if (!relPath || isExcluded(relPath)) continue;

      const destPath = path.join(process.cwd(), relPath);

      const fileData = await s3.getObject({ Bucket: S3_BUCKET, Key: obj.Key }).promise();
      const fileContent = fileData.Body.toString('utf-8');

      const existing = await fs.readFile(destPath, 'utf-8').catch(() => null);
      if (existing !== null && existing !== fileContent) {
        const backupPath = `${destPath}.local-backup-${Date.now()}`;
        await fs.rename(destPath, backupPath);
        console.log(`Local changes in ${relPath} preserved as ${path.basename(backupPath)}`);
      }

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, fileContent);
      pulledFiles.push(relPath);
      console.log(`Pulled ${relPath}`);
    }

    const pullLogDir = path.join(repoPath, 'pullCommits', pullId);
    await fs.mkdir(pullLogDir, { recursive: true });
    await fs.writeFile(
      path.join(pullLogDir, 'commit.json'),
      JSON.stringify(
        [
          {
            id: pullId,
            repositoryId,
            operation: 'pull',
            message: 'Pulled_Files',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            OperationFiles: pulledFiles,
          },
        ],
        null,
        2
      )
    );
  } catch (err) {
    console.error('Error pulling repo:', err);
  }
};

export default pullRepo;
