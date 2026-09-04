<div align="center">

<h1>RepoDoc - A GitHub Clone</h1>

<p><strong>A full-stack GitHub-inspired platform built with React, Node.js & MongoDB</strong></p>
  <a href="#-overview">Overview</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-cli-usage">CLI Usage</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-S3-FF9900?style=flat-square&logo=amazon-aws&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-Enabled-010101?style=flat-square&logo=socket.io" />
</p>

</div>

---

## 📖 Overview 

[Live](https://github-clone-one-smoky.vercel.app/)
[Video](https://drive.google.com/file/d/1mJQw6kKtSezEZrpc_MqAwr92K9UJMskJ/view?usp=drivesdk)

**RepoDoc** is a fully functional, GitHub-inspired version control platform built from scratch. It supports real repository management, a custom CLI for git-like operations, in-browser file editing with commit history, issue tracking, user authentication, and real-time features via Socket.io, all on a responsive UI powered by React and Bootstrap.

> A simplified but real GitHub — where you own and control the files of your project.

---

## ✨ Features

### 🗂️ Repository Management
- Full CRUD on repositories
- Edit file contents directly in the browser and save via commit
- File storage backed by **AWS S3**

### 👤 User Accounts
- Full CRUD on user profiles
- Image Upload via UploadThing
- Token-based authentication (JWT)

### 🐛 Issue Tracker
- Create, update, close, and delete issues per repository
- Close / Open issue for the repos

### ⭐ Social Features
- Star / Unstar repositories

### 💻 Custom CLI (Yargs-powered)

| Command | Description |
|--------|-------------|
| `node src/index.js init` | Initialize a local `.repoGit` repository |
| `node src/index.js add <file>` | Stage a file for commit |
| `node src/index.js commit <msg>` | Commit all staged files with a message |
| `node src/index.js push <username> <repoName>` | Push committed files to AWS S3 |
| `node src/index.js pull <repoName>` | Pull latest files from AWS S3 |
| `node src/index.js revert <commitID> <repoName>` | Revert a repo to a specific commit |

### 🔌 Real-time
- Socket.io integration for live updates (room-based per user ID)

### 📱 Responsive Design
- Fully responsive across all screen sizes using Bootstrap 5

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js, Bootstrap 5 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas) |
| **File Storage** | AWS S3 |
| **File Uploads** | UploadThing |
| **Authentication** | JWT (JSON Web Tokens) |
| **Real-time** | Socket.io |
| **CLI** | Yargs |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account and cluster
- An [AWS account](https://aws.amazon.com/) with an S3 bucket
- An [UploadThing](https://uploadthing.com/) account

---

### 1. Clone the Repository

```bash
git clone https://github.com/R-i-s-hi/GitHubClone.git
cd GitHubClone
```

---

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/GithubClone

# JWT
JWT_SECRET=your_super_secret_jwt_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
ACCESS_KEY=...
SECRET_ACCESS_KEY=...
S3_BUCKET=your-s3-bucket-name

# UploadThing
UPLOADTHING_TOKEN=...
UPLOADTHING_SECRET_KEY=your_uploadthing_secret
```

---

### 4. Start the Server

```bash
node src/index.js start
```

The API will be available at `http://localhost:5000`.

---

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

The app opens at `http://localhost:5173`.

---

## 💻 CLI Usage

The CLI is powered by [Yargs](https://yargs.js.org/) and shares the same `src/index.js` entry point as the server. All CLI commands are run as:

```bash
node src/index.js <command> [arguments]
```

### How It Works Locally

When you run `init`, the CLI creates a `.repoGit/` directory in your current working folder to manage staged files, commits, and history — similar to how `.git/` works in standard git.

```
.repoGit/
├── config.json        # S3 bucket config (set at init)
├── staging/           # Files staged via `add`, cleared after `commit`
├── commits/           # Local commits waiting to be pushed
├── prevCommits/       # Pushed commits (used as source for `revert`)
└── pullCommits/       # History of pull operations
```

---

### `init` — Initialize a Repository

```bash
node src/index.js init
```

Creates a `.repoGit/` directory in the current folder with a `commits/` subfolder and a `config.json` referencing your S3 bucket. Exits with a warning if the repo is already initialized.

```
Repository initialized successfully.
```

---

### `add <file>` — Stage a File

```bash
node src/index.js add <file>
```

Copies the specified file into `.repoGit/staging/`. The repository must be initialized first.

**Example:**

```bash
node src/index.js add demofile.txt
# File demofile.txt added to staging area!
```

---

### `commit <msg>` — Commit Staged Files

```bash
node src/index.js commit <message>
```

Moves all staged files out of `staging/` into a new UUID-named folder inside `commits/`. Generates a `commit.json` with metadata: commit ID, timestamp, message, and file list.

**Example:**

```bash
node src/index.js commit add_homepage
# Commit 3f2a1b4c-... created with message: "add_homepage"
```

**Generated `commit.json` structure:**

```json
[
  {
    "id": "3f2a1b4c-uuid-v4",
    "operation": "commit",
    "message": "add_homepage",
    "updatedAt": "2024-06-01T10:00:00.000Z",
    "OperationFiles": ["index.js", "style.css"]
  }
]
```

---

### `push <username> <repoName>` — Push Commits to S3

```bash
node src/index.js push <username> <repoName>
```

Verifies that the user and repository exist in the database, then uploads all local commits to S3 under the `<repoName>/` prefix. Commits are sorted by timestamp and pushed in order. Each pushed commit is moved to `prevCommits/` for future revert operations, and the local commit folder is removed.

**Example:**

```bash
node src/index.js push johndoe demo_repo
# All commits pushed to S3 successfully.
```

> ⚠️ You must have a registered account on the platform and have created the repository before pushing.

---

### `pull <repoName>` — Pull Files from S3

```bash
node src/index.js pull <repoName>
```

Lists all objects under `<repoName>/` in S3 and downloads each file into your current working directory (overwriting if they already exist). A new pull entry is appended to the remote `commit.json` on S3, and a local record is saved to `.repoGit/pullCommits/`.

**Example:**

```bash
node src/index.js pull demo_repo
# Pulled commit.json
# Pulled demofile.txt
```

---

### `revert <commitID> <repoName>` — Revert to a Commit

```bash
node src/index.js revert <commitID> <repoName>
```

Looks up the specified commit in `prevCommits/`, copies its files back into `commits/` with a `revert` operation entry in `commit.json`, and deletes the corresponding files from S3. After reverting, run `push` to apply the reverted state to S3.

**Example:**

```bash
node src/index.js revert 3f2a1b4c-uuid demo_repo
# Reverted index.js to commit 3f2a1b4c-...

# Then re-push the reverted state:
node src/index.js push johndoe demo_repo
```

> ℹ️ The `commitID` is the UUID printed when you ran `commit`, and is also stored in each `commit.json` file inside `prevCommits/`.

---

## 📡 API Reference

> All endpoints except auth routes require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/user/signup` | Register a new user |
| `POST` | `/user/login` | Login and receive a JWT |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user/allUsers` | Get all users |
| `GET` | `/user/userProfile/:id` | Get a user profile by ID |
| `GET` | `/user/:id/starRepos` | Get all starred repos of a user |
| `PUT` | `/user/starRepo/:repoid` | Star a repository |
| `PUT` | `/user/unstarRepo/:repoid` | Unstar a repository |
| `PUT` | `/user/updateProfile/:id` | Update user profile |
| `DELETE` | `/user/deleteProfile/:id` | Delete user account |

### Repositories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/repo/create` | Create a new repository |
| `GET` | `/repo/allrepos` | List all repositories |
| `GET` | `/repo/get/:userId` | Get repos by user ID |
| `GET` | `/repo/name/:name` | Fetch a repo by name |
| `GET` | `/repo/repoid/:id` | Fetch a repo by ID |
| `PATCH` | `/repo/toggleVis/:id` | Toggle repository visibility |
| `PUT` | `/repo/update/:id` | Update repository details |
| `DELETE` | `/repo/delete/:id` | Delete a repository |

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/issue/createIssue/:id` | Create a new issue for a repo |
| `GET` | `/issue/allIssues/:id` | Get all issues for a repo |
| `GET` | `/issue/:issueId` | Get a specific issue by ID |
| `PUT` | `/issue/:id` | Update an issue |
| `DELETE` | `/issue/:id` | Delete an issue |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/file/content` | Fetch file content from a repo |
| `PUT` | `/file/update/:reponame/:filename` | Edit a file and save as commit |

---

## 📁 Project Structure

```
GITHUBCLONE/
│
├── backend/                             # NodeJS backend
│   └── src/
│       │
│       ├── config/
│       │   ├── db-config.js             # MongoDB Atlas connection
│       │   └── aws-config.js            # AWS S3 client setup
│       │
│       ├── controllers/
│       │   ├── terminalCommands/
│       │   │   ├── init.js              # CLI: init — creates .repoGit/
│       │   │   ├── add.js               # CLI: add — stages files
│       │   │   ├── commit.js            # CLI: commit — creates UUID commit folder
│       │   │   ├── push.js              # CLI: push — uploads commits to S3
│       │   │   ├── pull.js              # CLI: pull — downloads files from S3
│       │   │   └── revert.js            # CLI: revert — rolls back to a commit
│       │   └── ...                      # REST API controllers
│       │
│       ├── models/                      # Mongoose schemas (User, Repo, Issue, etc.)
│       ├── routes/
│       │   ├── main.routes.js           # All API route definitions
│       │   └── ...                      # Other routes
│       ├── middleware/                  # JWT auth middleware
│       ├── utils/
│       │   ├── uploadthing.js           # UploadThing file router
│       │   └── helper.js                # isUserVerified, isRepoVerified
│       └── index.js                     # Entry point: server start + CLI (Yargs)
│
└── frontend/                            # React frontend
    ├── src/
    │   │
    │   ├── components/                  # UI components
    │   │   ├── auth/                    # SignUp, Login page
    │   │   ├── dashboard/               # Main dashboard
    │   │   ├── issue/                   # Issue Modals
    │   │   ├── repo/                    # Repo and file components
    │   │   ├── user/                    # Profile page
    │   │   ├── utils/                   # UploadThing
    │   │   ├── navbar.css
    │   │   └── Navbar.jsx
    │   │
    │   └── ...
    │   
    └── ...
```

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the Express server (default: `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | S3 bucket region (e.g. `us-east-1`) |
| `S3_BUCKET` | Name of your S3 bucket |
| `UPLOADTHING_SECRET_KEY` | UploadThing API secret |

---

<div align="center">

Built with ❤️ by [Rishabh](https://github.com/R-i-s-hi)

⭐ Star this repo if you found it helpful!

</div>
# GitGarden
