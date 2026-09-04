import fs from 'fs/promises'
import path from 'path'
import {s3, S3_BUCKET} from '../../config/aws-config.js'
import { isUserVerified, isRepoVerified } from '../../utils/helper.js'

const pushRepo = async (username, repoName) => {

    const verifiedUser = await isUserVerified(username);
    const verifiedRepo = await isRepoVerified(repoName);

    const verified = verifiedUser && verifiedRepo;
    if (!verified) {
      console.log('User or repo not verified.');
      console.log(`Please make sure you have created an account with name ${username}, as well as the repo with name ${repoName}.`);
      return;
    }

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
        
        for (const {dir} of dirsWithTimestamp) {

            const dirPath = path.join(commitPath, dir);
            const dirfiles = await fs.readdir(dirPath);

            const dirCommitFilePath = path.join(dirPath, "commit.json");
            const commitFileContent = await fs.readFile(dirCommitFilePath, "utf-8");
            const commitData = JSON.parse(commitFileContent);

            const newEntry = { ...commitData.find(c => c.id === dir), operation: 'push', updatedAt: new Date().toISOString() };
            commitData.push(newEntry);
            await fs.writeFile(dirCommitFilePath, JSON.stringify(commitData, null, 2));
            
            const prevCommitDirPath = path.join(prevCommitPath, dir);
            await fs.mkdir(prevCommitDirPath, { recursive: true });

            for (const file of dirfiles) {
                const filePath = path.join(dirPath, file);
                const fileContent = await fs.readFile(filePath);
                const params = {
                    Bucket: S3_BUCKET,
                    Key: `${repoName}/${file}`,
                    Body: fileContent,
                };

                await s3.upload(params).promise();

                await fs.copyFile(filePath, path.join(prevCommitDirPath, file));
                await fs.unlink(filePath);
            }

            await fs.rmdir(dirPath);
            
        }
        console.log('All commits pushed to S3 successfully.');

    } catch(e) {
        console.log('Error pushing to S3: ', e);
    }
}

export default pushRepo;