// Shared helpers for the .gitGarden metadata directory.
// Centralizing this avoids the naming/path drift that caused several of the
// bugs fixed in this pass (.repoGit vs .gitGarden, inconsistent exclude lists, etc).

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export const REPO_DIR_NAME = '.gitGarden';

// Anything matching these names, at any depth, is never staged, committed, or pulled.
export const EXCLUDED_NAMES = new Set([REPO_DIR_NAME, 'node_modules', '.env']);

export const getRepoPaths = (cwd = process.cwd()) => {
  const repoPath = path.resolve(cwd, REPO_DIR_NAME);
  return {
    repoPath,
    configPath: path.join(repoPath, 'config.json'),
    commitsPath: path.join(repoPath, 'commits'),
    stagingPath: path.join(repoPath, 'staging'),
    prevCommitsPath: path.join(repoPath, 'prevCommits'),
  };
};

export const repoExists = (cwd = process.cwd()) =>
  fsSync.existsSync(getRepoPaths(cwd).repoPath);

export const readLocalConfig = async (cwd = process.cwd()) => {
  const { configPath } = getRepoPaths(cwd);
  const raw = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(raw);
};

export const writeLocalConfig = async (config, cwd = process.cwd()) => {
  const { configPath } = getRepoPaths(cwd);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
};

// True if any path segment is an excluded name (.gitGarden, node_modules, .env).
export const isExcluded = (relPath) => {
  const segments = relPath.split(path.sep).join('/').split('/');
  return segments.some((seg) => EXCLUDED_NAMES.has(seg));
};

// Recursively walk a directory, returning POSIX-style relative paths and
// skipping excluded names at any depth. Used by add/commit/push/revert so
// nested directories are preserved instead of flattened.
export const walkFiles = async (dir, base = '') => {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  let out = [];
  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(await walkFiles(full, rel));
    } else {
      out.push(rel);
    }
  }
  return out;
};
