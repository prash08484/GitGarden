import {s3,S3_BUCKET} from "../config/aws-config.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from "bcryptjs";

export const fetchRepoFiles = async (repoName) => {

  try {
    const params = {
      Bucket: S3_BUCKET,
      Prefix: `${repoName}/`,
    };

    const data = await s3.listObjectsV2(params).promise();

    const files = data.Contents
      .filter(item => item.Key !== `${repoName}/commit.json`)
      .map(item => ({
      key: item.Key,
      fileName: item.Key.split("/").pop(),
      size: item.Size,
      lastModified: item.LastModified,
      }));
    
    const commitFile = data.Contents.find(item => item.Key === `${repoName}/commit.json`);
    let lastUpdated;
    let commitMsg;
    if (commitFile) {
      const commitData = await s3.getObject({
        Bucket: S3_BUCKET,
        Key: `${repoName}/commit.json`,
      }).promise();
      const commits = JSON.parse(commitData.Body.toString("utf-8"));
      lastUpdated = commits[commits.length - 1].updatedAt;
      commitMsg = commits[commits.length - 1].message;
    }


    return {files, lastUpdated, commitMsg};
  } catch (err) {
    console.error("Error fetching repo files:", err);
    return err;
  }
};

export const fetchRepoFileContent = async (req, res) => {

  const {key} = req.body;
  
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
    };

    const data = await s3.getObject(params).promise();
    const content = data.Body.toString("utf-8");
    res.json({ content });

  } catch (err) {
    console.error("Error fetching file content:", err);
    res.status(500).json({ error: "Failed to fetch file content" });
  }
};

export const updateRepoFileContent = async (req, res) => {
  
  try {
    const {reponame, filename} = req.params;
    const {content, commitName, password, userId} = req.body;

    const user = await User.findById(userId);
    const hashedPassword = user.password;

    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // commit.json
    const commitFile = await s3.getObject({
      Bucket: S3_BUCKET,
      Key: `${reponame}/commit.json`,
    }).promise();

    const commitData = JSON.parse(commitFile.Body.toString("utf-8"));
    commitData.push({
      id: uuidv4(),
      operation: "push",
      message: commitName,
      updatedAt: new Date().toISOString(),
      OperationFiles: [filename]
    })

    s3.putObject({
      Bucket: S3_BUCKET,
      Key: `${reponame}/commit.json`,
      Body: JSON.stringify(commitData),
      ContentType: "application/json",
    }).promise();

    // file
    const params = {
      Bucket: S3_BUCKET,
      Key: `${reponame}/${filename}`,
      Body: content,
      ContentType: "text/plain",
    };

    await s3.putObject(params).promise();
    res.json({ message: "File updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating file");
  }
}