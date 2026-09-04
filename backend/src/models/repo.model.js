import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    content: [
        {
            type: String,
        }
    ],
    visibility: {
        default: true,
        type: Boolean,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    issues: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Issue",
        }
    ]
}, { timestamps: true });

RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });

const Repository = mongoose.model('Repository', RepositorySchema);
export default Repository;