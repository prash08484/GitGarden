import readline from 'readline/promises';
import { writeCredentials } from '../../utils/globalConfig.js';

const promptForToken = async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const token = await rl.question('Paste your CLI token (Settings → CLI Tokens on the site): ');
  rl.close();
  return token.trim();
};

// login [token]: stores a CLI personal access token in the global,
// per-machine credentials file, used by push/pull/revert across ALL local repos.
const loginRepo = async (tokenArg) => {
  const token = tokenArg || (await promptForToken());

  if (!token || !token.startsWith('ggpat_')) {
    console.error('That doesn\'t look like a valid CLI token (should start with "ggpat_").');
    return;
  }

  await writeCredentials({ token });
  console.log('Logged in. This token will be used for push/pull/revert on this machine.');
};

export default loginRepo;