import { useState } from "react";
import Navbar from "../Navbar";
import "./form.css"
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
const url = import.meta.env.VITE_BASE_URI;
import { authHeaders } from "../utils/api";

export default function CreateRepoForm() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const [formData, setFormData] = useState({
        owner: `${userId}`,
        name: "",
        description: "",
        visibility: true,
    });
    const [createdRepo, setCreatedRepo] = useState(null); // holds the repo right after creation, for the setup screen

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            const data = await fetch(`${url}/repo/create`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(formData),
            });

            const jsonData = await data.json();

            if (data.status == 201) {
                toast.success("repository created!");
                setCreatedRepo(jsonData); // show the setup instructions instead of navigating away immediately
            } else {
                toast.error(jsonData.error || "Error creating repository. Please try again.");
            }

            setFormData({ owner: "", name: "", description: "", visibility: true });

        } catch (e) {
            console.log("error occured during repo creation: ", e);
        }
    };

    if (createdRepo) {
        const initCommand = `git-garden init ${createdRepo._id}`;

        return (
            <>
                <Navbar />
                <div className="createRepoForm">
                    <h2 style={{ marginBottom: "0.8rem" }}>{createdRepo.name} created</h2>
                    <p>
                        If you haven't already, generate a{" "}
                        <a href="/settings/cli-tokens" target="_blank" rel="noopener noreferrer">
                            CLI token
                        </a>, then log in once per machine:
                    </p>
                    <pre style={{ userSelect: "all", padding: "0.75rem", background: "#1a1a1a", color: "#f5f5f5", borderRadius: "6px" }}>
                        git-garden login
                    </pre>
                    <p>
                        Then, from inside your project folder, link it to this repository:
                    </p>
                    <pre style={{ userSelect: "all", padding: "0.75rem", background: "#1a1a1a", color: "#f5f5f5", borderRadius: "6px" }}>
                        {initCommand}
                    </pre>
                    <p>
                        After that, the usual flow works: <code>add</code> → <code>commit</code> → <code>push</code>.
                    </p>
                    <button className="submit-btn" onClick={() => navigate(`/repo/${createdRepo._id}`)}>
                        Go to repository
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <form onSubmit={handleSubmit} className="createRepoForm">
                <div>
                    <h2 style={{ marginBottom: "0.8rem" }}>Create a New Repository</h2>
                    <span> A repository contains all project files, including the revision history. Already have a project repository elsewhere? <a href="/create">import a repository</a></span>
                    <hr style={{ marginBlock: "0.8rem" }} />
                </div>

                <i>Required fields are marked with an asterisk (*)</i>

                <label>
                    Repository Name* <br />
                    <input
                        type="text"
                        name="name"
                        className="firstInput"
                        value={formData.name}
                        onChange={handleChange}
                        maxLength={20}
                        required
                    />
                    <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 20 characters</i>
                </label>

                <label>
                    Description (optional) <br />
                    <textarea
                        name="description"
                        className="firstInput"
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={100}
                        rows={5}
                    />
                    <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 100 characters</i>
                </label>

                <hr className="line" />

                <label className="visibilityLabel">
                    Visibility <br />

                    <div style={{ display: "flex", gap: "0.3rem" }}>
                        <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={formData.visibility === true}
                            onChange={() =>
                                setFormData((prev) => ({ ...prev, visibility: true }))
                            }
                        />
                        <span style={{ display: "flex", flexDirection: "column" }}>
                            <span>
                                Public
                            </span>
                            <span>
                                Anyone on the internet can see this repository.
                            </span>
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.3rem" }}>
                        <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={formData.visibility === false}
                            onChange={() =>
                                setFormData((prev) => ({ ...prev, visibility: false }))
                            }
                        />
                        <span style={{ display: "flex", flexDirection: "column" }}>
                            <span>
                                Private
                            </span>
                            <span>
                                You choose who commit or see this repository.
                            </span>
                        </span>
                    </div>
                </label>

                <hr className="line" />

                <button className="submit-btn" type="submit">Create Repository</button>
            </form>
        </>
    );
}