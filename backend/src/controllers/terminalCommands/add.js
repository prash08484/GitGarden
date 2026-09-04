import fs from 'fs/promises'
import path from 'path'


const addRepo = async (filePath) => {
    const repoPath = path.resolve(process.cwd(), '.repoGit');

    try {
        await fs.access(repoPath);
    } catch {
        console.error("Repo is not initialized. Please initialize the repo before adding files.");
        return;
    }

    const stagingPath = path.join(repoPath, 'staging');

    try {

        await fs.mkdir(stagingPath, { recursive: true });
        const fileName = path.basename(filePath);

        await fs.copyFile(filePath, path.join(stagingPath, fileName));
        console.log(`File ${fileName} added to staging area!`);


    } catch (e) {
        console.error("Error adding file:", e);
    }
}

export default addRepo;