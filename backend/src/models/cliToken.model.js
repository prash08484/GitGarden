import mongoose from 'mongoose';

const CliTokenSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, default: 'CLI token' },
  tokenHash: { type: String, required: true, unique: true }, 
  tokenPrefix: { type: String, required: true },
  lastUsedAt: { type: Date, default: null },
}, { timestamps: true });

const CliToken = mongoose.model('CliToken', CliTokenSchema);
export default CliToken;