import express from 'express';
import {
    createRepo,
    getAllRepos,
    fetchRepoById,
    fetchRepoByName,
    getRepo,
    updateRepoById,
    toggleVisById,
    deleteRepoById
} from '../controllers/repo.controller.js';
import authenticate from '../middlewares/authe.middleware.js';
import { authorizeRepositoryOwner } from '../middlewares/autho.middleware.js';
import { pushSnapshot } from '../controllers/files.controller.js'; 

const repoRouter = express.Router();

repoRouter.post('/:id/push', authenticate, authorizeRepositoryOwner, pushSnapshot);
repoRouter.post('/create', authenticate, createRepo);
repoRouter.get('/allrepos', getAllRepos);
repoRouter.get('/get/:userId', getRepo);
repoRouter.get('/name/:name', fetchRepoByName);
repoRouter.get('/repoid/:id', fetchRepoById);
repoRouter.patch('/toggleVis/:id', authenticate, authorizeRepositoryOwner, toggleVisById);
repoRouter.put('/update/:id', authenticate, authorizeRepositoryOwner, updateRepoById);
repoRouter.delete('/delete/:id', authenticate, authorizeRepositoryOwner, deleteRepoById);

export default repoRouter;