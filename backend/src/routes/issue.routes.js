import express from 'express';
import { createIssue, getAllIssues, getIssueById, updateIssueById, deleteIssueById } from '../controllers/issue.controller.js';
import authenticate from '../middlewares/authe.middleware.js';
import { authorizeIssueAccess, authorizeRepositoryOwner } from '../middlewares/autho.middleware.js';

const issueRouter = express.Router();


issueRouter.post('/createIssue/:id', authenticate, authorizeRepositoryOwner, createIssue);
issueRouter.get('/allIssues/:id', getAllIssues);
issueRouter.get('/:issueId', getIssueById);
issueRouter.put('/:id', authenticate, authorizeIssueAccess, updateIssueById);
issueRouter.delete('/:id', authenticate, authorizeIssueAccess, deleteIssueById);

export default issueRouter;