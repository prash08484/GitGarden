import express from 'express';
import userRouter from './user.routes.js';
import repoRouter from './repo.routes.js';
import issueRouter from './issue.routes.js';
import fileRouter from './file.routes.js';

const mainRouter = express.Router();

mainRouter.use('/user', userRouter);
mainRouter.use('/repo', repoRouter);
mainRouter.use('/issue', issueRouter);
mainRouter.use('/file', fileRouter);

mainRouter.get('/', (req, res) => {
    res.send('Welcome to the Main Route');
});

export default mainRouter;