import { clearCredentials } from '../../utils/globalConfig.js';

const logoutRepo = async () => {
  await clearCredentials();
  console.log('Logged out. Local credentials removed from this machine.');
};

export default logoutRepo;