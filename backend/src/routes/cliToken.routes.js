import express from 'express';
import { createCliToken, listCliTokens, revokeCliToken } from '../controllers/cliToken.controller.js';
import authenticate from '../middlewares/authe.middleware.js';

const cliTokenRouter = express.Router();

cliTokenRouter.post('/', authenticate, createCliToken);
cliTokenRouter.get('/', authenticate, listCliTokens);
cliTokenRouter.delete('/:tokenId', authenticate, revokeCliToken);

export default cliTokenRouter;