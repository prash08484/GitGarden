import express from 'express';
import {fetchRepoFileContent, updateRepoFileContent} from "../controllers/files.controller.js";


const fileRouter = express.Router();

fileRouter.post('/content', fetchRepoFileContent);
fileRouter.put('/update/:reponame/:filename', updateRepoFileContent);

export default fileRouter;