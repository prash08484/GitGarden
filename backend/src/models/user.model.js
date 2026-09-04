import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: true
    },
    repositories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Repository"
    }],
    followedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    starRepositories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Repository",
    }],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;