import mongoose from "mongoose";
import Issue from "../models/issue.model.js";

export const createIssue = async(req, res) => {
  const { title, description, user } = req.body;
  const { id } = req.params;

  try {
    const issue = new Issue({
      title,
      description,
      repository: id,
      createdBy: user
    });

    await issue.save();

    res.status(201).json(issue);
  } catch (err) {
    console.error("Error during issue creation : ", err.message);
    res.status(500).send("Server error");
  }
}

export const getAllIssues = async(req, res) => {
    const { id } = req.params;

  try {
    const issues = await Issue.find({ repository: id })
                              .populate({
                                path: 'repository',
                                select: 'name owner visibility',
                                populate: {path: "owner", select: "_id"}
                              })
                              .populate('createdBy', 'username');

    if (!issues || issues.length === 0) {
      return res.status(404).json({ error: "Issues not found!" });
    }
    res.status(200).json(issues);
  } catch (err) {
    console.error("Error during issue fetching : ", err.message);
    res.status(500).send("Server error");
  }
}

export const getIssueById = async(req, res) => {
  const { issueId } = req.params;
  try {
    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    res.json(issue);
  } catch (err) {
    console.error("Error during issue fetching : ", err.message);
    res.status(500).send("Server error");
  }
}

export const updateIssueById = async(req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;
    if (status !== undefined) issue.status = status;

    await issue.save();

    res.status(200).json( { issue, message: "Issue updated" });
  } catch (err) {
    console.error("Error during issue updation : ", err.message);
    res.status(500).send("Server error");
  }
}

export const deleteIssueById = async(req, res) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }
    res.status(200).json({ message: "Issue deleted" });
  } catch (err) {
    console.error("Error during issue deletion : ", err.message);
    res.status(500).send("Server error");
  }
}