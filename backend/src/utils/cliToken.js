import crypto from 'crypto';

// Recognizable prefix so the auth middleware can tell a CLI token apart from
// a browser JWT at a glance, without needing to try/fail JWT verification first.
const TOKEN_PREFIX = 'ggpat_';

export const generateCliToken = () => {
  const raw = crypto.randomBytes(32).toString('base64url');
  return `${TOKEN_PREFIX}${raw}`;
};

// SHA-256, not bcrypt: this token is high-entropy (32 random bytes) and needs
// a fast, indexable O(1) DB lookup by hash — unlike a password, it can't be
// brute-forced offline even with a fast hash, so bcrypt's slowness buys nothing here.
export const hashCliToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const isCliToken = (token) => typeof token === 'string' && token.startsWith(TOKEN_PREFIX);