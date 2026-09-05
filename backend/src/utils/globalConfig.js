import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// Lives in the user's home directory, NOT inside any project folder — this is
// a per-machine login, independent of which repo are linked locally.
const GLOBAL_DIR = path.join(os.homedir(), '.gitgarden');
const CREDENTIALS_PATH = path.join(GLOBAL_DIR, 'credentials.json');

export const readCredentials = async () => {
  try {
    const raw = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const writeCredentials = async (creds) => {
  await fs.mkdir(GLOBAL_DIR, { recursive: true });
  // mode 0o600: owner read/write only. Honored on POSIX 
  // ignores POSIX file modes, so this is defense-in-depth, not a hard guarantee there.
  await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
};

export const clearCredentials = async () => {
  await fs.rm(CREDENTIALS_PATH, { force: true });
};

export const getStoredToken = async () => {
  const creds = await readCredentials();
  return creds?.token ?? null;
};