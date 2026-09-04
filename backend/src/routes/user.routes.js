import express from 'express';
import { signup, login, getAllUsers, getUserProfile, updateUserProfile, deleteUserProfile, starRepository, unstarRepository, fetchStarRepos } from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.get('/allUsers', getAllUsers);
userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.get('/userProfile/:id', getUserProfile);
userRouter.get('/:id/starRepos', fetchStarRepos);
userRouter.put('/starRepo/:repoid', starRepository);
userRouter.put("/unstarRepo/:repoid", unstarRepository);
userRouter.put('/updateProfile/:id', updateUserProfile);
userRouter.delete('/deleteProfile/:id', deleteUserProfile);

export default userRouter;