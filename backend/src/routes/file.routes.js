import express from 'express';
import { fetchRepoFileContent, updateRepoFileContent } from "../controllers/files.controller.js";
import authenticate from "../middlewares/authe.middleware.js";
import { authorizeRepositoryOwner } from "../middlewares/autho.middleware.js";

const fileRouter = express.Router();

fileRouter.get('/content', authenticate, fetchRepoFileContent);
fileRouter.put('/update/:id', authenticate, authorizeRepositoryOwner, updateRepoFileContent);

export default fileRouter;