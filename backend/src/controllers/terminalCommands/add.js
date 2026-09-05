import fs from 'fs/promises';
import path from 'path';
import { getRepoPaths, repoExists, isExcluded, walkFiles } from './repoConfig.js';

const copyIntoStaging = async (absPath, relPath, stagingPath) => {
  const dest = path.join(stagingPath, relPath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(absPath, dest);
};

// add <file> — stage a single file, preserving its path relative to the repo root.
// add .      — stage everything under the repo root (excluding .gitGarden, node_modules, .env).
const addRepo = async (target) => {
  if (!repoExists()) {
    console.error('Repo is not initialized. Please initialize the repo before adding files.');
    return;
  }

  const { stagingPath } = getRepoPaths();
  await fs.mkdir(stagingPath, { recursive: true });

  try {
    if (target === '.') {
      const files = await walkFiles(process.cwd());
      for (const relPath of files) {
        await copyIntoStaging(path.join(process.cwd(), relPath), relPath, stagingPath);
      }
      console.log(`Added ${files.length} file(s) to staging area.`);
      return;
    }

    const absPath = path.resolve(process.cwd(), target);
    const relPath = path.relative(process.cwd(), absPath).split(path.sep).join('/');

    if (relPath.startsWith('..')) {
      console.error('Cannot add a path outside the repository.');
      return;
    }
    if (isExcluded(relPath)) {
      console.error(`Skipped "${relPath}" — excluded path (.gitGarden, node_modules, or .env).`);
      return;
    }

    const stat = await fs.stat(absPath).catch(() => null);
    if (!stat) {
      console.error(`File not found: ${target}`);
      return;
    }

    if (stat.isDirectory()) {
      const files = await walkFiles(absPath, relPath);
      for (const rel of files) {
        await copyIntoStaging(path.join(process.cwd(), rel), rel, stagingPath);
      }
      console.log(`Added ${files.length} file(s) under ${relPath}/ to staging area.`);
    } else {
      await copyIntoStaging(absPath, relPath, stagingPath);
      console.log(`File ${relPath} added to staging area!`);
    }
  } catch (e) {
    console.error('Error adding file:', e);
  }
};

export default addRepo;
