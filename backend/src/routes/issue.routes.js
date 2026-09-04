import express from 'express';
import { createIssue, getAllIssues, getIssueById, updateIssueById, deleteIssueById } from '../controllers/issue.controller.js';

const issueRouter = express.Router();


issueRouter.post('/createIssue/:id', createIssue);
issueRouter.get('/allIssues/:id', getAllIssues);
issueRouter.get('/:issueId', getIssueById);
issueRouter.put('/:id', updateIssueById);
issueRouter.delete('/:id', deleteIssueById);

export default issueRouter;