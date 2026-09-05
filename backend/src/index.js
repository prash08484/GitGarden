import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import http from 'http';
import {Server} from 'socket.io';
import dotenv from "dotenv";
dotenv.config();


import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';


import { createRouteHandler } from "uploadthing/express";
import fileRouter from "../src/utils/uploadthing.js";


import initRepo from './controllers/terminalCommands/init.js';
import addRepo from './controllers/terminalCommands/add.js';
import commitRepo from './controllers/terminalCommands/commit.js';
import pushRepo from './controllers/terminalCommands/push.js';
import pullRepo from './controllers/terminalCommands/pull.js';
import revertRepo from './controllers/terminalCommands/revert.js';
import loginRepo from './controllers/terminalCommands/login.js';
import logoutRepo from './controllers/terminalCommands/logout.js';


import mainRouter from './routes/main.routes.js';
import { connectDB } from './config/db-config.js';


const startServer = () => {
    const app = express();
    const port = process.env.PORT || 5000;

    app.use(cors({origin: '*'}));
    app.use(bodyParser.json({limit: '10mb'}));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    app.use(express.json());

    app.use('/', mainRouter);
    app.use("/api/uploadthing", createRouteHandler({ router: fileRouter, config: { secret: process.env.UPLOADTHING_SECRET_KEY }, }));

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: ["https://github-clone-one-smoky.vercel.app/", "http://localhost:5173"],
            methods: ["GET", "POST"]
        }}
    );

    io.on("connection", (socket) => {
        socket.on("joinRoom", (userID) => {
            user = userID;
            console.log("====================");
            console.log(`User connected: ${user}`);
            console.log("====================");
            socket.join(userID);
        })
    })

    const db = mongoose.connection;
    db.once('open', async() => {
        console.log("CRUD operations called!");
    });

    httpServer.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    })
}

yargs(hideBin(process.argv))
    .command(
        "start",
        "Starts a new backend server",
        {},
        async () => {
            await connectDB();
            startServer();
        }
    )
    .command(
        "login [token]",
        "Log in with a CLI token generated from Settings on the site",
        (yargs) => {
            yargs.positional('token', {
                describe: 'CLI token (if omitted, you will be prompted to paste it)',
                type: 'string'
            });
        },
        (argv) => loginRepo(argv.token)
    )
    .command(
        "logout",
        "Remove the stored CLI token from this machine",
        {},
        () => logoutRepo()
    )
    .command(
        "init [repositoryId]",
        "Initialize a new repository, optionally linking it to a remote repositoryId",
        (yargs) => {
            yargs.positional('repositoryId', {
                describe: 'Mongo _id of the repository on the server (optional)',
                type: 'string'
            });
        },
        (argv) => initRepo(argv.repositoryId ?? null)
    )
    .command(
        "add <file>",
        "Add a file to staged",
        (yargs) => {
            yargs.positional('file', {
                describe: 'File to add',
                type: 'string'
            });
        },
        (argv) => {
            addRepo(argv.file);
        }
    )
    .command(
        "commit <msg>",
        "Commit the staged files",
        (yargs) => {
            yargs.positional('msg', {
                describe: 'commit message',
                type: 'string'
            });
        },
        (argv) => {
            commitRepo(argv.msg);
        }
    )
    .command(
        "push",
        "Push locally committed changes for the repository linked in .gitGarden/config.json",
        {},
        () => pushRepo()
    )
    .command(
        "pull",
        "Pull the latest changes for the repository linked in .gitGarden/config.json",
        {},
        () => pullRepo()
    )
    .command(
        "revert <commitID>",
        "Revert to a specific commit",
        (yargs) => {
            yargs.positional('commitID', {
                describe: 'Commit ID to revert to',
                type: 'string'
            });
        },
        (argv) => revertRepo(argv.commitID)
    )
    .demandCommand(1, 'You need at least one command!')
    .help().argv;