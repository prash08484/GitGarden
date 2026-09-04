import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import { s3, S3_BUCKET } from "../../config/aws-config.js";


const pullRepo = async (repoName) => {

    try {
        const id = uuidv4();
        const data = await s3.listObjectsV2({
            Bucket: S3_BUCKET,
            Prefix: `${repoName}/`
        }).promise();
   
        if (!data.Contents || data.Contents.length === 0) {
            console.log(`No files found in S3 for repo: ${repoName}`);
            return;
        }
        const files = data.Contents.map(items => items.Key.split("/")[1]);

        for (const obj of data.Contents) {
            const fileName = obj.Key.split("/")[1];

            if(fileName === "commit.json") {
                const commitData = await s3.getObject({
                    Bucket: S3_BUCKET,
                    Key: `${repoName}/commit.json`
                }).promise();
                let commitContent = JSON.parse(commitData.Body.toString("utf-8"));
                const newCommit = {
                    id: id,
                    operation: "pull",
                    message: "Pulled_Files",
                    updatedAt: new Date().toISOString(),
                    OperationFiles: files
                }
                commitContent.push(newCommit);

                await s3.putObject({
                    Bucket: S3_BUCKET,
                    Key: `${repoName}/commit.json`,
                    Body: JSON.stringify(commitContent, null, 2),
                    ContentType: "application/json",
                }).promise();

                await fs.mkdir(path.join(process.cwd(), ".repoGit", "pullCommits", id), { recursive: true });
                await fs.writeFile(path.join(process.cwd(), ".repoGit", "pullCommits", id, "commit.json"), JSON.stringify(commitContent));

            } else {
                const destPath = path.join(process.cwd(), fileName);
                const isExists = await fs.access(destPath).then(() => true).catch(() => false);
                
                if (isExists) {
                    await fs.unlink(destPath)
                }
    
                const fileData = await s3.getObject({
                    Bucket: S3_BUCKET,
                    Key: `${repoName}/${fileName}`
                })
                .promise();
    
                const fileContent = fileData.Body.toString("utf-8");
                await fs.writeFile(destPath, fileContent);

                await fs.mkdir(path.join(process.cwd(), ".repoGit", "pullCommits", id), { recursive: true });
                await fs.writeFile(path.join(process.cwd(), ".repoGit", "pullCommits", id, `${fileName}`), fileContent);
            }
            console.log(`Pulled ${fileName}`);
        }
    } catch (err) {
        console.error("Error pulling repo from S3:", err);
    }
};

export default pullRepo;