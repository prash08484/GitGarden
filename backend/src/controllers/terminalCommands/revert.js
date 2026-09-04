import fs from "fs";
import path from "path";
import { promisify } from "util";
import {s3, S3_BUCKET} from '../../config/aws-config.js'
import { isRepoVerified } from '../../utils/helper.js'

const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);

const revertRepo = async (commitID, repoName) => {
    const verified = await isRepoVerified(repoName);
    if (!verified) {
        console.log(`Repo ${repoName} not verified. Please make sure the repo exists.`);
        return;
    }

    const repoPath = path.resolve(process.cwd(), ".repoGit");
    const prevCommitsPath = path.join(repoPath, "prevCommits");
    const revertCommitsPath = path.join(repoPath, "commits");


    try {
        const commitDirPath = path.join(prevCommitsPath, commitID);
        const revertCommitDirPath = path.join(revertCommitsPath, commitID);

        if (!fs.existsSync(commitDirPath)) {
            console.log(`Commit ${commitID} not found in prevCommits folder.`);
            return;
        }

        if (fs.existsSync(revertCommitDirPath)) {
            console.log(`Commit ${commitID} already exists in commits folder. push it to the a repo.`);
            return;
        }

        await fs.promises.mkdir(revertCommitDirPath, { recursive: true });
        const files = await readdir(commitDirPath);

        for (const file of files) {

            const src = path.join(commitDirPath, file);
            const dest = path.join(revertCommitDirPath, file);


            if (file === "commit.json") {
                const data = await fs.promises.readFile(src, "utf-8");
                const commits = JSON.parse(data);
                const revertEntry = commits.find(c => c.id === commitID);
                const newEntry = { ...revertEntry, operation: 'revert', updatedAt: new Date().toISOString()};
                commits.push(newEntry);
                await fs.promises.writeFile(dest, JSON.stringify(commits, null, 2));
            } else {
                await copyFile(src, dest);
            }

            const params = {
                Bucket: S3_BUCKET,
                Key: `${repoName}/${file}`,
            }

            await s3.deleteObject(params).promise();

            if(file !== "commit.json") {
                console.log(`Reverted ${file} to commit ${commitID}`);
            }
        }

        await fs.promises.rm(commitDirPath, { recursive: true, force: true });
    } catch (e) {
        console.log(`Unable to revert commit ${commitID}:`, e);
    }
};

export default revertRepo;