import fs from 'fs/promises';
import path from 'path';
import { s3, S3_BUCKET } from '../../config/aws-config.js';
import { isUserVerified } from '../../utils/helper.js';
import Repository from '../../models/repo.model.js';
import { buildRepoFileKey } from '../../utils/s3Key.js';

const walkFiles = async (dir, base = "") => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let out = [];
    for (const entry of entries) {
        const rel = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            out = out.concat(await walkFiles(path.join(dir, entry.name), rel));
        } else {
            out.push(rel);
        }
    }
    return out;
};

const pushRepo = async (username, repoName) => {

    const verifiedUser = await isUserVerified(username);
    const repository = await Repository.findOne({ name: repoName });

    if (!verifiedUser || !repository) {
        console.log('User or repo not verified.');
        console.log(`Please make sure you have created an account with name ${username}, as well as the repo with name ${repoName}.`);
        return;
    }

    const repositoryId = repository._id.toString();

    const repoPath = path.resolve(process.cwd(), '.repoGit');
    const commitPath = path.join(repoPath, 'commits');
    const prevCommitPath = path.join(repoPath, 'prevCommits');

    try {
        await fs.mkdir(prevCommitPath, { recursive: true });
        const dirs = await fs.readdir(commitPath);

        const dirsWithTimestamp = await Promise.all(
            dirs.map(async (dir) => {
                const dirCommitFilePath = path.join(commitPath, dir, 'commit.json');
                const commitFileContent = await fs.readFile(dirCommitFilePath, 'utf-8');
                const commitData = JSON.parse(commitFileContent);
                const commitEntry = commitData.find((c) => c.id === dir);
                return { dir, createdAt: commitEntry?.createdAt ?? null };
            })
        );

        dirsWithTimestamp.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        for (const { dir } of dirsWithTimestamp) {

            const dirPath = path.join(commitPath, dir);

            const dirCommitFilePath = path.join(dirPath, "commit.json");
            const commitFileContent = await fs.readFile(dirCommitFilePath, "utf-8");
            const commitData = JSON.parse(commitFileContent);

            const newEntry = { ...commitData.find(c => c.id === dir), operation: 'push', updatedAt: new Date().toISOString() };
            commitData.push(newEntry);
            await fs.writeFile(dirCommitFilePath, JSON.stringify(commitData, null, 2));

            const prevCommitDirPath = path.join(prevCommitPath, dir);
            await fs.mkdir(prevCommitDirPath, { recursive: true });

            // walk the whole commit dir (including nested folders) instead of a flat readdir
            const relativeFiles = await walkFiles(dirPath);

            for (const relPath of relativeFiles) {
                const filePath = path.join(dirPath, relPath);
                const fileContent = await fs.readFile(filePath);

                // validated, repo-scoped key: repositories/<repositoryId>/<relPath>
                const key = buildRepoFileKey(repositoryId, relPath);

                const params = {
                    Bucket: S3_BUCKET,
                    Key: key,
                    Body: fileContent,
                };

                await s3.upload(params).promise();

                const prevDestPath = path.join(prevCommitDirPath, relPath);
                await fs.mkdir(path.dirname(prevDestPath), { recursive: true }); // preserve subfolders locally too
                await fs.copyFile(filePath, prevDestPath);
                await fs.unlink(filePath);
            }

            // recursive: after unlinking files, nested (now-empty) subdirectories remain
            await fs.rm(dirPath, { recursive: true, force: true });

        }
        console.log('All commits pushed to S3 successfully.');

    } catch(e) {
        console.log('Error pushing to S3: ', e);
    }
}

export default pushRepo;