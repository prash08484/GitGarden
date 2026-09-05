import CliToken from '../models/cliToken.model.js';
import { generateCliToken, hashCliToken } from '../utils/cliToken.js';

// Called from the website while the user is logged in with a normal browser
// session. The raw token is returned exactly once, in this response — it is
// never recoverable again after this, only revocable.
export const createCliToken = async (req, res) => {
  try {
    const { label } = req.body;
    const rawToken = generateCliToken();

    await CliToken.create({
      owner: req.user._id,
      label: label || 'CLI token',
      tokenHash: hashCliToken(rawToken),
      tokenPrefix: rawToken.slice(0, 14), // e.g. "ggpat_AbCd1234"
    });

    res.status(201).json({ token: rawToken });
  } catch (err) {
    console.error('Error creating CLI token:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const listCliTokens = async (req, res) => {
  try {
    const tokens = await CliToken.find({ owner: req.user._id })
      .select('label tokenPrefix createdAt lastUsedAt')
      .sort({ createdAt: -1 });
    res.status(200).json(tokens);
  } catch (err) {
    console.error('Error listing CLI tokens:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const revokeCliToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = await CliToken.findOneAndDelete({ _id: tokenId, owner: req.user._id });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    res.status(200).json({ message: 'Token revoked' });
  } catch (err) {
    console.error('Error revoking CLI token:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};