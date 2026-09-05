import fs from "fs";
import path from "path";
import { promisify } from "util";
import { s3, S3_BUCKET } from '../../config/aws-config.js';
import Repository from '../../models/repo.model.js';
import { buildRepoFileKey } from '../../utils/s3Key.js';

const copyFile = promisify(fs.copyFile);

const walkFiles = async (dir, base = "") => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
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

const revertRepo = async (commitID, repoName) => {
    const repository = await Repository.findOne({ name: repoName });
    if (!repository) {
        console.log(`Repo ${repoName} not verified. Please make sure the repo exists.`);
        return;
    }
    const repositoryId = repository._id.toString();

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

        // walk instead of flat readdir, so nested files revert correctly
        const relativeFiles = await walkFiles(commitDirPath);

        for (const relPath of relativeFiles) {

            const src = path.join(commitDirPath, relPath);
            const dest = path.join(revertCommitDirPath, relPath);
            await fs.promises.mkdir(path.dirname(dest), { recursive: true }); // preserve subfolders

            if (relPath === "commit.json") {
                const data = await fs.promises.readFile(src, "utf-8");
                const commits = JSON.parse(data);
                const revertEntry = commits.find(c => c.id === commitID);
                const newEntry = { ...revertEntry, operation: 'revert', updatedAt: new Date().toISOString() };
                commits.push(newEntry);
                await fs.promises.writeFile(dest, JSON.stringify(commits, null, 2));
            } else {
                await copyFile(src, dest);
            }

            // validated, repo-scoped key: repositories/<repositoryId>/<relPath>
            const key = buildRepoFileKey(repositoryId, relPath);
            await s3.deleteObject({ Bucket: S3_BUCKET, Key: key }).promise();

            if (relPath !== "commit.json") {
                console.log(`Reverted ${relPath} to commit ${commitID}`);
            }
        }

        await fs.promises.rm(commitDirPath, { recursive: true, force: true });
    } catch (e) {
        console.log(`Unable to revert commit ${commitID}:`, e);
    }
};

export default revertRepo;