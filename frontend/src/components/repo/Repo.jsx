import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from '../Navbar';
import './repo.css'
const url = import.meta.env.VITE_BASE_URI;

function Repo() {
    const { id } = useParams();
    const [repo, setRepo] = useState(null);
    const [repoData, setRepoData] = useState(null);
    const [isStared, setIsStared] = useState(false);
    const [currRepoId, setCurrRepoId] = useState("");
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [toBeFileContent, setToBeFileContent] = useState("");
    const [commitName, setCommitName] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [commitMsg, setCommitMsg] = useState(null);

    const currUser = localStorage.getItem("userId");
    const navigate = useNavigate();

    const [formValues, setFormValues] = useState({
        name: "",
        description: "",
        visibility: true,
    });

    const [issueValues, setIssueValues] = useState({
        title: "",
        description: "",
        user: currUser
    });


    const handleFileClick = async (file) => {
        setSelectedFile(file.fileName);
        const content = await fetch(`${url}/file/content`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ key: file.key })
        });

        const data = await content.json();
        setFileContent(data.content);
        setToBeFileContent(data.content);
    };

    const handlePassModalOpen = () => {
        if (fileContent === toBeFileContent) {
            toast.error("No changes made to the file!")
        } else {
            const modal2 = document.getElementById("editFileModal");
            const editModal = bootstrap.Modal.getInstance(modal2);
            if (editModal) editModal.hide();

            const modal = new bootstrap.Modal(document.getElementById("PasswordModal"));
            modal.show();
        }
    }

    const handleConfirmFileUpdateClick = async (e) => {
        e.preventDefault()
        if (!commitName || !userPassword) {
            toast.error("Please fill in all fields!");
            return;
        }
        if (toBeFileContent !== fileContent) {
            setFileContent(toBeFileContent);
        }

        try {
            const res = await fetch(`${url}/file/update/${repo.name}/${selectedFile}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: toBeFileContent, commitName: commitName, password: userPassword, userId: currUser })
            });

            if (res.status === 200) toast.success("File updated successfully!")
            if (res.status === 401) toast.error("Invalid password!")

        } catch (e) {
            toast.error("Failed to update file!");
        } finally {
            setCommitName("");
            setUserPassword("");
            const modalEl = document.getElementById("PasswordModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
        }

    }

    const handleFileContentChange = (e) => {
        setToBeFileContent(e.target.value);
    };

    const handleCommitNameChange = (e) => {
        setCommitName(e.target.value);
    }

    const handlePasswordChange = (e) => {
        setUserPassword(e.target.value);
    }

    useEffect(() => {
        if (repoData) {
            setFormValues({
                name: repoData.name || "",
                description: repoData.description || "",
                visibility: repoData.visibility,
            });
        }
    }, [repoData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleIssueChange = (e) => {
        const { name, value } = e.target;
        setIssueValues((prev) => ({ ...prev, [name]: value }));
    };

    const fetchRepo = async () => {
        try {
            const data = await fetch(`${url}/repo/repoid/${id}`);
            if (data.status !== 200) {
                toast.error("Something went wrong!");
                return;
            }
            const jsonData = await data.json();

            setRepo(jsonData.repository);
            setRepoData(jsonData.repository);
            setCurrRepoId(jsonData.repository._id);
            setFiles(jsonData.files);
            setLastUpdated(jsonData.lastUpdated);
            setCommitMsg(jsonData.commitMsg);
        } catch (e) {
            console.log("error while fetching repo: ", e);
        }
    };

    useEffect(() => {
        if (!currRepoId) return;
        const checkStarred = async () => {
            const result = await fetch(`${url}/user/${currUser}/starRepos`);
            const data = await result.json();
            const stared = data.some((repo) => repo._id === currRepoId);
            setIsStared(stared);

        };
        checkStarred();
    }, [currRepoId, currUser]);

    const deleteRepo = async (repoId) => {
        try {
            const result = await fetch(`${url}/repo/delete/${repoId}`, { method: "DELETE" });

            if (result.status == 200) {
                toast.success("repo deleted successfully");
                navigate(`/profile/${currUser}`);

            }
        } catch (e) {
            console.log(e);
            toast.error("something went wrong!");
        }
    }

    const saveChanges = async (e) => {
        e.preventDefault();
        try {
            const result = await fetch(`${url}/repo/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues),
            });

            if (result.status === 200) {
                toast.success("Repo edited successfully!");
                await fetchRepo();
                const modalEl = document.getElementById("staticBackdrop2");
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            } else {
                toast.error("Update failed!");
            }
        } catch (e) {
            console.log("saveChanges error: ", e);
            toast.error("Something went wrong!");
        }
    };

    const handleStaring = async (repoid) => {
        if (!isStared) {
            const result = await fetch(`${url}/user/starRepo/${repoid}`, {
                method: "PUT",
                body: JSON.stringify({ userId: currUser }),
                headers: { "Content-Type": "application/json" }
            });
            if (result.status == 200) {
                setIsStared(true);
                toast.success("repository is stared!");
            }
        } else {
            const result = await fetch(`${url}/user/unstarRepo/${repoid}`, {
                method: "PUT",
                body: JSON.stringify({ userId: currUser }),
                headers: { "Content-Type": "application/json" }
            });
            if (result.status == 200) {
                setIsStared(false);
                toast.success("repository is unstared!");
            }
        }
    }

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        try {

            const data = await fetch(`${url}/issue/createIssue/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(issueValues),
            });

            if (data.status == 201) {
                toast.success("issue created!");
                const modalEl = document.getElementById("staticBackdrop3");
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                navigate(`/repo/${id}`);

            } else {
                toast.error("something went wrong!");
            }

            setIssueValues({ title: "", description: "", user: currUser });

        } catch (e) {
            console.log("error occured during repo creation: ", e);
        }
    };

    useEffect(() => {
        fetchRepo();
    }, [id]);

    return (
        <div>
            <Navbar />
            <div className="repo-div">
                {repo && (
                    <>
                        <div className='heading-div'>
                            <span>
                                <h4 className='mb-0 d-flex flex-column'>
                                    {repo.name}
                                    {currUser && repo.owner && currUser != repo.owner._id ? (
                                        <Link to={`/profile/${repo.owner._id}`} id="userProfileLink">
                                            <i style={{ marginBottom: "0", fontSize: "10px" }}>@{repo.owner.username}</i>
                                        </Link>
                                    ) : (
                                        <></>
                                    )
                                    }
                                </h4>
                                {repo.visibility ? (
                                    <span className="badge text-bg-secondary">public</span>
                                ) : (
                                    <span className="badge text-bg-secondary">private</span>
                                )}
                            </span>

                            <div className='heading-btns'>
                                {repo.owner._id == currUser ?
                                    (
                                        <>
                                            <button type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop2">
                                                <p>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M19.3028 3.7801C18.4241 2.90142 16.9995 2.90142 16.1208 3.7801L14.3498 5.5511C14.3442 5.55633 14.3387 5.56166 14.3333 5.5671C14.3279 5.57253 14.3225 5.57803 14.3173 5.58359L5.83373 14.0672C5.57259 14.3283 5.37974 14.6497 5.27221 15.003L4.05205 19.0121C3.9714 19.2771 4.04336 19.565 4.23922 19.7608C4.43508 19.9567 4.72294 20.0287 4.98792 19.948L8.99703 18.7279C9.35035 18.6203 9.67176 18.4275 9.93291 18.1663L20.22 7.87928C21.0986 7.0006 21.0986 5.57598 20.22 4.6973L19.3028 3.7801ZM14.8639 7.15833L6.89439 15.1278C6.80735 15.2149 6.74306 15.322 6.70722 15.4398L5.8965 18.1036L8.56029 17.2928C8.67806 17.257 8.7852 17.1927 8.87225 17.1057L16.8417 9.13619L14.8639 7.15833ZM17.9024 8.07553L19.1593 6.81862C19.4522 6.52572 19.4522 6.05085 19.1593 5.75796L18.2421 4.84076C17.9492 4.54787 17.4743 4.54787 17.1814 4.84076L15.9245 6.09767L17.9024 8.07553Z" className='icon-path' />
                                                    </svg>
                                                    <span>Edit</span>
                                                </p>
                                            </button>
                                            <div class="modal fade" id="staticBackdrop2" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                <div class="modal-dialog modal-dialog-centered">
                                                    <div class="modal-content" style={{ backgroundColor: "#0c1110", color: "whitesmoke", border: "0.8px solid #808080ac" }}>
                                                        <div class="modal-header py-3 px-4" style={{ borderBottom: "0.8px solid #808080ac" }}>
                                                            <h1 class="modal-title fs-6 fw-bold" id="staticBackdropLabel">Edit Repo</h1>
                                                        </div>
                                                        <div class="modal-body px-4">
                                                            <form onSubmit={saveChanges} className="edit-repo-form">
                                                                <div>
                                                                    <label htmlFor="name">Repository Name</label>
                                                                    <input
                                                                        type="text"
                                                                        id="name"
                                                                        name="name"
                                                                        maxLength={20}
                                                                        value={formValues.name}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                    <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 20 characters</i>
                                                                </div>

                                                                <div>
                                                                    <label htmlFor="description">Description</label>
                                                                    <textarea
                                                                        id="description"
                                                                        name="description"
                                                                        rows={5}
                                                                        maxLength={100}
                                                                        value={formValues.description}
                                                                        onChange={handleChange}
                                                                    />
                                                                    <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 100 characters</i>
                                                                </div>

                                                                <div>
                                                                    <label className="visibilityLabel">
                                                                        Visibility <br />

                                                                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.3rem" }}>
                                                                            <input
                                                                                type="radio"
                                                                                name="visibility"
                                                                                checked={formValues.visibility === true}
                                                                                onChange={() =>
                                                                                    setFormValues((prev) => ({ ...prev, visibility: true }))
                                                                                }
                                                                            />
                                                                            <div className='mb-0' style={{ display: "flex", flexDirection: "column" }}>
                                                                                <p className='mb-0' style={{ color: "whitesmoke" }}>Public</p>
                                                                                <p className='mb-0'>Anyone on the internet can see this repository.</p>
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.3rem" }}>
                                                                            <input
                                                                                type="radio"
                                                                                name="visibility"
                                                                                checked={formValues.visibility === false}
                                                                                onChange={() =>
                                                                                    setFormValues((prev) => ({ ...prev, visibility: false }))
                                                                                }
                                                                            />

                                                                            <div className='mb-0' style={{ display: "flex", flexDirection: "column" }}>
                                                                                <p className='mb-0' style={{ color: "whitesmoke" }}>Private</p>
                                                                                <p className='mb-0'>You choose who can commit or see this repository.</p>
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                </div>

                                                                <span class="modal-footer px-4 pe-0" style={{ borderTop: "0" }}>
                                                                    <button type="button" class="btn btn-secondary fw-semibold px-3" data-bs-dismiss="modal">Cancel</button>
                                                                    <button type="submit" class="btn fw-semibold px-4" style={{ backgroundColor: "green", color: "whitesmoke", border: "1px solid green" }}>Save</button>
                                                                </span>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                                <p>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                        <path d="M14.7223 12.7585C14.7426 12.3448 14.4237 11.9929 14.01 11.9726C13.5963 11.9522 13.2444 12.2711 13.2241 12.6848L12.9999 17.2415C12.9796 17.6552 13.2985 18.0071 13.7122 18.0274C14.1259 18.0478 14.4778 17.7289 14.4981 17.3152L14.7223 12.7585Z" class="icon-path" />
                                                        <path d="M9.98802 11.9726C9.5743 11.9929 9.25542 12.3448 9.27577 12.7585L9.49993 17.3152C9.52028 17.7289 9.87216 18.0478 10.2859 18.0274C10.6996 18.0071 11.0185 17.6552 10.9981 17.2415L10.774 12.6848C10.7536 12.2711 10.4017 11.9522 9.98802 11.9726Z" class="icon-path" />
                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.249 2C9.00638 2 7.99902 3.00736 7.99902 4.25V5H5.5C4.25736 5 3.25 6.00736 3.25 7.25C3.25 8.28958 3.95503 9.16449 4.91303 9.42267L5.54076 19.8848C5.61205 21.0729 6.59642 22 7.78672 22H16.2113C17.4016 22 18.386 21.0729 18.4573 19.8848L19.085 9.42267C20.043 9.16449 20.748 8.28958 20.748 7.25C20.748 6.00736 19.7407 5 18.498 5H15.999V4.25C15.999 3.00736 14.9917 2 13.749 2H10.249ZM14.499 5V4.25C14.499 3.83579 14.1632 3.5 13.749 3.5H10.249C9.83481 3.5 9.49902 3.83579 9.49902 4.25V5H14.499ZM5.5 6.5C5.08579 6.5 4.75 6.83579 4.75 7.25C4.75 7.66421 5.08579 8 5.5 8H18.498C18.9123 8 19.248 7.66421 19.248 7.25C19.248 6.83579 18.9123 6.5 18.498 6.5H5.5ZM6.42037 9.5H17.5777L16.96 19.7949C16.9362 20.191 16.6081 20.5 16.2113 20.5H7.78672C7.38995 20.5 7.06183 20.191 7.03807 19.7949L6.42037 9.5Z" class="icon-path" />
                                                    </svg>
                                                    <span>Delete</span>
                                                </p>
                                            </button>
                                            <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                <div class="modal-dialog modal-dialog-centered">
                                                    <div class="modal-content" style={{ backgroundColor: "#0c1110", color: "whitesmoke", border: "0.8px solid #808080ac" }}>
                                                        <div class="modal-header py-3 px-4" style={{ borderBottom: "0.8px solid #808080ac" }}>
                                                            <h1 class="modal-title fs-6 fw-bold" id="staticBackdropLabel">Delete Repo</h1>
                                                        </div>
                                                        <div class="modal-body px-4">
                                                            Are you sure you want to delete your repo?
                                                        </div>
                                                        <div class="modal-footer px-4" style={{ borderTop: "0" }}>
                                                            <button type="button" class="fw-semibold px-3" data-bs-dismiss="modal">Cancel</button>
                                                            <button type="button" class="btn fw-semibold px-3" data-bs-dismiss="modal" onClick={() => deleteRepo(repo._id)} style={{ backgroundColor: "red", color: "whitesmoke", border: "1px solid red" }}>Delete</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (<></>)
                                }
                                <button className="starBtn" onClick={() => handleStaring(repo._id)}>
                                    <p>
                                        {isStared ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.21481 8.27571L2.21967 3.28057C1.92678 2.98768 1.92678 2.51281 2.21967 2.21991C2.51256 1.92702 2.98744 1.92702 3.28033 2.21991L21.7794 20.7189C22.0722 21.0118 22.0722 21.4867 21.7794 21.7796C21.4865 22.0725 21.0116 22.0725 20.7187 21.7796L18.3107 19.3716L18.3703 19.555C18.4707 19.864 18.3607 20.2026 18.0978 20.3936C17.835 20.5845 17.479 20.5845 17.2161 20.3936L11.9996 16.6035L6.78296 20.3936C6.52009 20.5845 6.16415 20.5845 5.90128 20.3936C5.63841 20.2026 5.52842 19.864 5.62883 19.555L7.62139 13.4226L2.40479 9.63247C2.14193 9.44149 2.03193 9.10297 2.13234 8.79395C2.23275 8.48493 2.52071 8.27571 2.84563 8.27571L7.21481 8.27571ZM15.9744 17.0353L16.2304 17.8233L12.4404 15.0697C12.1775 14.8787 11.8216 14.8787 11.5587 15.0697L7.7687 17.8233L9.21636 13.3678C9.31676 13.0588 9.20677 12.7203 8.9439 12.5293L5.1539 9.77571H8.71481L15.9744 17.0353Z" className='icon-path' />
                                                <path d="M18.8452 9.77571L15.3808 12.2927L16.4547 13.3666L21.5943 9.63247C21.8572 9.44149 21.9672 9.10297 21.8668 8.79395C21.7664 8.48493 21.4784 8.27571 21.1535 8.27571L14.7054 8.27571L12.7128 2.14324C12.6124 1.83422 12.3245 1.625 11.9996 1.625C11.6746 1.625 11.3867 1.83422 11.2863 2.14324L9.80136 6.71327L10.9918 7.90368L11.9996 4.80205L13.4472 9.25747C13.5476 9.56649 13.8356 9.77571 14.1605 9.77571H18.8452Z" className='icon-path' />
                                            </svg>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9996 2.125C12.2851 2.125 12.5459 2.28707 12.6722 2.54308L15.3264 7.9211L21.2614 8.78351C21.5439 8.82456 21.7786 9.02244 21.8669 9.29395C21.9551 9.56546 21.8815 9.86351 21.6771 10.0628L17.3825 14.249L18.3963 20.16C18.4445 20.4414 18.3289 20.7257 18.0979 20.8936C17.867 21.0614 17.5608 21.0835 17.3081 20.9506L11.9996 18.1598L6.69122 20.9506C6.43853 21.0835 6.13233 21.0614 5.90137 20.8936C5.67041 20.7257 5.55475 20.4414 5.603 20.16L6.61682 14.249L2.32222 10.0628C2.11779 9.86351 2.04421 9.56546 2.13243 9.29395C2.22065 9.02244 2.45536 8.82456 2.73788 8.78351L8.67288 7.9211L11.3271 2.54308C11.4534 2.28707 11.7142 2.125 11.9996 2.125ZM11.9996 4.56966L9.84348 8.93853C9.73423 9.15989 9.52306 9.31331 9.27878 9.34881L4.45745 10.0494L7.94619 13.4501C8.12296 13.6224 8.20362 13.8706 8.16189 14.1139L7.33831 18.9158L11.6506 16.6487C11.8691 16.5338 12.1302 16.5338 12.3486 16.6487L16.661 18.9158L15.8374 14.1139C15.7957 13.8706 15.8763 13.6224 16.0531 13.4501L19.5418 10.0494L14.7205 9.34881C14.4762 9.31331 14.2651 9.15989 14.1558 8.93853L11.9996 4.56966Z" className='icon-path' />
                                            </svg>
                                        )}

                                        <span>{isStared ? "Unstar" : "Star"}</span>
                                    </p>
                                </button>
                            </div>
                        </div>

                        <hr style={{ opacity: "0.08" }} />

                        <div className='repo-files-div'>
                            <div className="repo-files">
                                <div className="branch">
                                    <div className='left'>
                                        <button className='dropdown-toggle'>
                                            <p className="mb-0">
                                                <svg width="17" height="17" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.37695 6.5C9.70342 5.34575 10.7647 4.5 12.0234 4.5C13.2822 4.5 14.3435 5.34575 14.6699 6.5H17.5234V5.75C17.5234 5.33579 17.8592 5 18.2734 5H21.2734C21.6877 5 22.0234 5.33579 22.0234 5.75V8.75C22.0234 9.16421 21.6877 9.5 21.2734 9.5H18.2734C17.8592 9.5 17.5234 9.16421 17.5234 8.75V8H14.6699C14.5874 8.29175 14.4579 8.56379 14.2902 8.80745C14.9649 9.00678 15.5533 9.29519 16.0641 9.64928C17.0743 10.3497 17.7359 11.2759 18.1681 12.175C18.5993 13.0719 18.8111 13.9592 18.9163 14.6157C18.9385 14.7538 18.956 14.8825 18.9699 15H19.7734C20.1877 15 20.5234 15.3358 20.5234 15.75V18.75C20.5234 19.1642 20.1877 19.5 19.7734 19.5H16.7734C16.3592 19.5 16.0234 19.1642 16.0234 18.75V15.75C16.0234 15.3358 16.3592 15 16.7734 15H17.4574C17.4507 14.9527 17.4433 14.9037 17.4352 14.8531C17.3451 14.2908 17.1663 13.5531 16.8162 12.825C16.4673 12.0991 15.9569 11.4003 15.2094 10.882C14.468 10.368 13.4485 10 12.0234 10C10.5984 10 9.57886 10.368 8.83749 10.882C8.08995 11.4003 7.57962 12.0991 7.23063 12.825C6.88055 13.5531 6.70175 14.2908 6.61164 14.8531C6.60353 14.9037 6.59617 14.9527 6.58948 15H7.27344C7.68765 15 8.02344 15.3365 8.02344 15.7507V18.75C8.02344 19.1642 7.68765 19.5 7.27344 19.5H4.27344C3.85922 19.5 3.52344 19.1642 3.52344 18.75V15.75C3.52344 15.3358 3.85922 15 4.27344 15H5.07695C5.09086 14.8825 5.10841 14.7538 5.13054 14.6157C5.23575 13.9592 5.44758 13.0719 5.87875 12.175C6.311 11.2759 6.97255 10.3497 7.98282 9.64928C8.49353 9.29519 9.08194 9.00678 9.75666 8.80745C9.58893 8.56379 9.45947 8.29175 9.37695 8H6.52344V8.75C6.52344 9.16421 6.18765 9.5 5.77344 9.5H2.77344C2.35922 9.5 2.02344 9.16421 2.02344 8.75V5.75C2.02344 5.33579 2.35922 5 2.77344 5H5.77344C6.18765 5 6.52344 5.33579 6.52344 5.75V6.5H9.37695ZM13.2734 7.25C13.2734 7.94036 12.7138 8.5 12.0234 8.5C11.3331 8.5 10.7734 7.94036 10.7734 7.25C10.7734 6.55964 11.3331 6 12.0234 6C12.7138 6 13.2734 6.55964 13.2734 7.25ZM17.5234 18V16.5H19.0234V18H17.5234ZM5.02344 18V16.5H6.52344V18H5.02344ZM3.52344 8V6.5H5.02344V8H3.52344ZM19.0234 8H20.5234V6.5H19.0234V8Z" className='icon-path' />
                                                </svg>

                                                main
                                            </p>
                                        </button>
                                        <p className="mb-0">
                                            <svg width="18" height="18" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.37695 6.5C9.70342 5.34575 10.7647 4.5 12.0234 4.5C13.2822 4.5 14.3435 5.34575 14.6699 6.5H17.5234V5.75C17.5234 5.33579 17.8592 5 18.2734 5H21.2734C21.6877 5 22.0234 5.33579 22.0234 5.75V8.75C22.0234 9.16421 21.6877 9.5 21.2734 9.5H18.2734C17.8592 9.5 17.5234 9.16421 17.5234 8.75V8H14.6699C14.5874 8.29175 14.4579 8.56379 14.2902 8.80745C14.9649 9.00678 15.5533 9.29519 16.0641 9.64928C17.0743 10.3497 17.7359 11.2759 18.1681 12.175C18.5993 13.0719 18.8111 13.9592 18.9163 14.6157C18.9385 14.7538 18.956 14.8825 18.9699 15H19.7734C20.1877 15 20.5234 15.3358 20.5234 15.75V18.75C20.5234 19.1642 20.1877 19.5 19.7734 19.5H16.7734C16.3592 19.5 16.0234 19.1642 16.0234 18.75V15.75C16.0234 15.3358 16.3592 15 16.7734 15H17.4574C17.4507 14.9527 17.4433 14.9037 17.4352 14.8531C17.3451 14.2908 17.1663 13.5531 16.8162 12.825C16.4673 12.0991 15.9569 11.4003 15.2094 10.882C14.468 10.368 13.4485 10 12.0234 10C10.5984 10 9.57886 10.368 8.83749 10.882C8.08995 11.4003 7.57962 12.0991 7.23063 12.825C6.88055 13.5531 6.70175 14.2908 6.61164 14.8531C6.60353 14.9037 6.59617 14.9527 6.58948 15H7.27344C7.68765 15 8.02344 15.3365 8.02344 15.7507V18.75C8.02344 19.1642 7.68765 19.5 7.27344 19.5H4.27344C3.85922 19.5 3.52344 19.1642 3.52344 18.75V15.75C3.52344 15.3358 3.85922 15 4.27344 15H5.07695C5.09086 14.8825 5.10841 14.7538 5.13054 14.6157C5.23575 13.9592 5.44758 13.0719 5.87875 12.175C6.311 11.2759 6.97255 10.3497 7.98282 9.64928C8.49353 9.29519 9.08194 9.00678 9.75666 8.80745C9.58893 8.56379 9.45947 8.29175 9.37695 8H6.52344V8.75C6.52344 9.16421 6.18765 9.5 5.77344 9.5H2.77344C2.35922 9.5 2.02344 9.16421 2.02344 8.75V5.75C2.02344 5.33579 2.35922 5 2.77344 5H5.77344C6.18765 5 6.52344 5.33579 6.52344 5.75V6.5H9.37695ZM13.2734 7.25C13.2734 7.94036 12.7138 8.5 12.0234 8.5C11.3331 8.5 10.7734 7.94036 10.7734 7.25C10.7734 6.55964 11.3331 6 12.0234 6C12.7138 6 13.2734 6.55964 13.2734 7.25ZM17.5234 18V16.5H19.0234V18H17.5234ZM5.02344 18V16.5H6.52344V18H5.02344ZM3.52344 8V6.5H5.02344V8H3.52344ZM19.0234 8H20.5234V6.5H19.0234V8Z" className='icon-path' />
                                            </svg>
                                            Branch
                                        </p>
                                        <p className="mb-0">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.25 6C3.83579 6 3.5 6.33579 3.5 6.75V9.02784C4.83047 9.36221 5.81555 10.5663 5.81555 12.0005C5.81555 13.4348 4.83047 14.6389 3.5 14.9733V17.25C3.5 17.6642 3.83579 18 4.25 18H19.75C20.1642 18 20.5 17.6642 20.5 17.25V14.973C19.1701 14.6382 18.1855 13.4344 18.1855 12.0005C18.1855 10.5667 19.1701 9.36287 20.5 9.02811V6.75C20.5 6.33579 20.1642 6 19.75 6H4.25ZM2 6.75C2 5.50736 3.00736 4.5 4.25 4.5H19.75C20.9926 4.5 22 5.50736 22 6.75V9.68555C22 10.0997 21.6643 10.4355 21.2502 10.4355C20.386 10.4357 19.6855 11.1363 19.6855 12.0005C19.6855 12.8647 20.386 13.5653 21.2502 13.5655C21.6643 13.5656 22 13.9014 22 14.3155V17.25C22 18.4926 20.9926 19.5 19.75 19.5H4.25C3.00736 19.5 2 18.4926 2 17.25V14.3155C2 13.9013 2.33579 13.5655 2.75 13.5655C3.61433 13.5655 4.31555 12.8649 4.31555 12.0005C4.31555 11.1362 3.61487 10.4355 2.75055 10.4355C2.33633 10.4355 2 10.0998 2 9.68555V6.75Z" className='icon-path' />
                                            </svg>

                                            Tags
                                        </p>
                                    </div>

                                    <div>
                                        <div className="d-flex justify-content-start justify-content-md-center">
                                            <button type="button" className="submit-btn" data-bs-toggle="modal" data-bs-target="#staticBackdrop3">
                                                <svg width="14" height="14" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.13354 2.07934C9.50403 1.8941 9.95453 2.04427 10.1398 2.41475L10.6825 3.50024L10.7007 3.50016H13.3466C13.3989 3.50016 13.451 3.50198 13.5027 3.50557L14.0481 2.41475C14.2334 2.04427 14.6839 1.8941 15.0544 2.07934C15.4248 2.26459 15.575 2.71509 15.3898 3.08557L14.8805 4.10404C15.0738 4.28408 15.2369 4.49958 15.359 4.74393L16.238 6.50191C17.4392 6.54884 18.3986 7.53746 18.3986 8.75016V9.48177L19.7955 9.03571C20.1901 8.9097 20.6121 9.12743 20.7381 9.52201C20.8641 9.9166 20.6464 10.3386 20.2518 10.4646L18.3986 11.0564V13.1252H20.0236C20.4379 13.1252 20.7736 13.461 20.7736 13.8752C20.7736 14.2894 20.4379 14.6252 20.0236 14.6252H18.3986V15.6252C18.3986 15.9799 18.3697 16.3279 18.3139 16.6669L20.2518 17.2857C20.6464 17.4117 20.8641 17.8337 20.7381 18.2283C20.6121 18.6229 20.1901 18.8406 19.7955 18.7146L17.8969 18.1083C16.9287 20.3955 14.6636 22.0002 12.0236 22.0002C9.3837 22.0002 7.11855 20.3955 6.15035 18.1083L4.25179 18.7146C3.85721 18.8406 3.43519 18.6229 3.30918 18.2283C3.18318 17.8337 3.40091 17.4117 3.79549 17.2857L5.73333 16.6669C5.67762 16.3279 5.64864 15.9799 5.64864 15.6252V14.6252H4.02364C3.60943 14.6252 3.27364 14.2894 3.27364 13.8752C3.27364 13.461 3.60943 13.1252 4.02364 13.1252H5.64864V11.0564L3.79549 10.4646C3.40091 10.3386 3.18318 9.9166 3.30918 9.52201C3.43519 9.12743 3.85721 8.9097 4.25179 9.03571L5.64864 9.48177V8.75016C5.64864 7.53746 6.60804 6.54884 7.80924 6.50191L8.68823 4.74393C8.83049 4.45942 9.02818 4.21402 9.26443 4.01817L8.79813 3.08557C8.61289 2.71509 8.76306 2.26459 9.13354 2.07934ZM14.5601 6.50016L14.0174 5.41475C13.8904 5.16067 13.6307 5.00016 13.3466 5.00016H10.7007C10.4166 5.00016 10.1569 5.16067 10.0299 5.41475L9.48716 6.50016H14.5601ZM7.89864 8.00016C7.48443 8.00016 7.14864 8.33595 7.14864 8.75016V15.6252C7.14864 18.3176 9.33125 20.5002 12.0236 20.5002C14.716 20.5002 16.8986 18.3176 16.8986 15.6252V8.75016C16.8986 8.33595 16.5629 8.00016 16.1486 8.00016H7.89864Z" className='icon-path' />
                                                </svg>
                                                <span>Issue</span>
                                            </button>
                                        </div>
                                        <div class="modal fade" id="staticBackdrop3" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                            <div class="modal-dialog modal-dialog-centered">
                                                <div class="modal-content" style={{ backgroundColor: "#0c1110", color: "whitesmoke", border: "0.8px solid #808080ac" }}>
                                                    <div class="modal-header py-3 px-4" style={{ borderBottom: "0.8px solid #808080ac" }}>
                                                        <h1 class="modal-title fs-6 fw-bold" id="staticBackdropLabel">Create issue</h1>
                                                    </div>
                                                    <div class="modal-body px-4">
                                                        <form onSubmit={handleIssueSubmit} className="edit-repo-form">
                                                            <div>
                                                                <label htmlFor="name">Issue Title</label>
                                                                <input
                                                                    type="text"
                                                                    id="name"
                                                                    name="title"
                                                                    maxLength={20}
                                                                    value={issueValues.title}
                                                                    onChange={handleIssueChange}
                                                                    required
                                                                />
                                                                <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 20 characters</i>
                                                            </div>

                                                            <div>
                                                                <label htmlFor="description">Description</label>
                                                                <textarea
                                                                    id="description"
                                                                    name="description"
                                                                    maxLength={100}
                                                                    rows="5"
                                                                    value={issueValues.description}
                                                                    onChange={handleIssueChange}
                                                                />
                                                                <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 100 characters</i>
                                                            </div>

                                                            <span class="modal-footer p-0" style={{ borderTop: "0" }}>
                                                                <button type="button" class="btn btn-secondary fw-semibold px-4" data-bs-dismiss="modal">Cancel</button>
                                                                <button type="submit" class="btn fw-semibold px-4" style={{ backgroundColor: "green", color: "whitesmoke", border: "1px solid green" }}>Add</button>
                                                            </span>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="files">
                                    <div className='files-heading'>
                                        <div className='left'>
                                            {fileContent && fileContent.length > 0 && selectedFile.length > 0 ? (
                                                <p className='mb-0'>{selectedFile}</p>
                                            ) : (
                                                <p className='mb-0'>Files</p>
                                            )}
                                        </div>
                                        {fileContent && fileContent.length > 0 && selectedFile.length > 0 ? (
                                            <>
                                                <button id='editFileBtn' type="button" data-bs-toggle="modal" data-bs-target="#editFileModal">
                                                    <p className='mb-0'>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.3028 3.7801C18.4241 2.90142 16.9995 2.90142 16.1208 3.7801L14.3498 5.5511C14.3442 5.55633 14.3387 5.56166 14.3333 5.5671C14.3279 5.57253 14.3225 5.57803 14.3173 5.58359L5.83373 14.0672C5.57259 14.3283 5.37974 14.6497 5.27221 15.003L4.05205 19.0121C3.9714 19.2771 4.04336 19.565 4.23922 19.7608C4.43508 19.9567 4.72294 20.0287 4.98792 19.948L8.99703 18.7279C9.35035 18.6203 9.67176 18.4275 9.93291 18.1663L20.22 7.87928C21.0986 7.0006 21.0986 5.57598 20.22 4.6973L19.3028 3.7801ZM14.8639 7.15833L6.89439 15.1278C6.80735 15.2149 6.74306 15.322 6.70722 15.4398L5.8965 18.1036L8.56029 17.2928C8.67806 17.257 8.7852 17.1927 8.87225 17.1057L16.8417 9.13619L14.8639 7.15833ZM17.9024 8.07553L19.1593 6.81862C19.4522 6.52572 19.4522 6.05085 19.1593 5.75796L18.2421 4.84076C17.9492 4.54787 17.4743 4.54787 17.1814 4.84076L15.9245 6.09767L17.9024 8.07553Z" className='icon-path' />
                                                        </svg>
                                                        <span>edit</span>
                                                    </p>
                                                </button>
                                                <div class="modal fade" id="editFileModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                    <div class="modal-dialog modal-dialog-centered">
                                                        <div class="modal-content" style={{ backgroundColor: "#0c1110", color: "whitesmoke", border: "0.8px solid #808080ac" }}>
                                                            <div class="modal-header py-3 px-4" style={{ borderBottom: "0.8px solid #808080ac" }}>
                                                                <h1 class="modal-title fs-6 fw-bold" id="staticBackdropLabel">Edit {selectedFile}</h1>
                                                            </div>
                                                            <div class="modal-body px-4">
                                                                <form className="edit-repo-form">

                                                                    <div>
                                                                        <label htmlFor="description">Content</label>
                                                                        <textarea
                                                                            id="description"
                                                                            name="description"
                                                                            rows={10}
                                                                            maxLength={1000}
                                                                            value={toBeFileContent}
                                                                            onChange={handleFileContentChange}
                                                                        />
                                                                        <i style={{ color: "#808080", fontSize: "9.5px", textAlign: "right", display: "inline-block", width: "100%" }} >*max 1000 characters</i>
                                                                    </div>

                                                                    <span class="modal-footer" style={{ borderTop: "0", paddingRight: "0" }}>
                                                                        <button type="button" class="btn btn-secondary fw-semibold px-3 cancel" data-bs-dismiss="modal" onClick={() => setToBeFileContent(fileContent)}>Cancel</button>
                                                                        <button type="button" class="btn fw-semibold px-3" id='editFileBtn' style={{ backgroundColor: "green", color: "whitesmoke", border: "1px solid green" }} onClick={handlePassModalOpen}>Save</button>
                                                                    </span>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="modal fade" id="PasswordModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                                    <div class="modal-dialog modal-dialog-centered">
                                                        <div class="modal-content" style={{ backgroundColor: "#0c1110", color: "whitesmoke", border: "0.8px solid #808080ac" }}>
                                                            <div class="modal-header py-3 px-4" style={{ borderBottom: "0.8px solid #808080ac" }}>
                                                                <h1 class="modal-title fs-6 fw-bold" id="staticBackdropLabel">Password Verification</h1>
                                                            </div>
                                                            <div class="modal-body px-4">
                                                                <form onSubmit={handleConfirmFileUpdateClick} className="edit-repo-form">

                                                                    <input
                                                                        type="text"
                                                                        maxLength={40}
                                                                        placeholder='Enter commit name'
                                                                        value={commitName}
                                                                        onChange={handleCommitNameChange}
                                                                        style={{ backgroundColor: "black", padding: "4px 8px", fontSize: "13.5px", color: "whitesmoke", border: "0.8px solid #808080ac", borderRadius: "6px" }}
                                                                    />
                                                                    <input
                                                                        type="password"
                                                                        minLength={6}
                                                                        placeholder='Enter your password'
                                                                        value={userPassword}
                                                                        onChange={handlePasswordChange}
                                                                        style={{ backgroundColor: "black", padding: "4px 8px", fontSize: "13.5px", color: "whitesmoke", border: "0.8px solid #808080ac", borderRadius: "6px" }}
                                                                    />

                                                                    <span class="modal-footer" style={{ borderTop: "0", paddingRight: "0" }}>
                                                                        <button type="button" class="btn btn-secondary fw-semibold px-3 cancel" data-bs-dismiss="modal">Cancel</button>
                                                                        <button type="submit" class="btn fw-semibold px-3" style={{ backgroundColor: "green", color: "whitesmoke", border: "1px solid green" }}>Save</button>
                                                                    </span>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className='right'>
                                                <p className='mb-0'>
                                                    <svg width="17" height="17" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                        <path d="M3.13644 9.54175C3.02923 9.94185 3.26667 10.3531 3.66676 10.4603C4.06687 10.5675 4.47812 10.3301 4.58533 9.92998C5.04109 8.22904 6.04538 6.72602 7.44243 5.65403C8.83948 4.58203 10.5512 4.00098 12.3122 4.00098C14.0731 4.00098 15.7848 4.58203 17.1819 5.65403C18.3999 6.58866 19.3194 7.85095 19.8371 9.28639L18.162 8.34314C17.801 8.1399 17.3437 8.26774 17.1405 8.62867C16.9372 8.98959 17.0651 9.44694 17.426 9.65017L20.5067 11.3849C20.68 11.4825 20.885 11.5072 21.0766 11.4537C21.2682 11.4001 21.4306 11.2727 21.5282 11.0993L23.2629 8.01828C23.4661 7.65734 23.3382 7.2 22.9773 6.99679C22.6163 6.79358 22.159 6.92145 21.9558 7.28239L21.195 8.63372C20.5715 6.98861 19.5007 5.54258 18.095 4.464C16.436 3.19099 14.4033 2.50098 12.3122 2.50098C10.221 2.50098 8.1883 3.19099 6.52928 4.464C4.87027 5.737 3.67766 7.52186 3.13644 9.54175Z" fill="#f1f6fd" />
                                                        <path d="M21.4906 14.4582C21.5978 14.0581 21.3604 13.6469 20.9603 13.5397C20.5602 13.4325 20.1489 13.6699 20.0417 14.07C19.5859 15.7709 18.5816 17.274 17.1846 18.346C15.7875 19.418 14.0758 19.999 12.3149 19.999C10.5539 19.999 8.84219 19.418 7.44514 18.346C6.2292 17.4129 5.31079 16.1534 4.79261 14.721L6.45529 15.6573C6.81622 15.8605 7.27356 15.7327 7.47679 15.3718C7.68003 15.0108 7.55219 14.5535 7.19127 14.3502L4.11056 12.6155C3.93723 12.5179 3.73222 12.4932 3.54065 12.5467C3.34907 12.6003 3.18662 12.7278 3.08903 12.9011L1.3544 15.9821C1.15119 16.3431 1.27906 16.8004 1.64 17.0036C2.00094 17.2068 2.45828 17.079 2.66149 16.718L3.42822 15.3562C4.05115 17.0054 5.12348 18.4552 6.532 19.536C8.19102 20.809 10.2237 21.499 12.3149 21.499C14.406 21.499 16.4387 20.809 18.0977 19.536C19.7568 18.263 20.9494 16.4781 21.4906 14.4582Z" fill="#f1f6fd" />
                                                    </svg>
                                                    commits
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {files && files.length > 0 ? (
                                        <div>
                                            {selectedFile.length > 0 && fileContent && fileContent.length > 0 ? (
                                                <div className="d-flex">
                                                    <button className='btn border-none' style={{ height: "fit-content", border: "none", outline: "none" }} onClick={() => { setSelectedFile(""); setFileContent("") }}>
                                                        <svg width="14" height="14" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                            <path d="M3.57813 12.4981C3.5777 12.6905 3.65086 12.8831 3.79761 13.0299L9.7936 19.0301C10.0864 19.3231 10.5613 19.3233 10.8543 19.0305C11.1473 18.7377 11.1474 18.2629 10.8546 17.9699L6.13418 13.2461L20.3295 13.2461C20.7437 13.2461 21.0795 12.9103 21.0795 12.4961C21.0795 12.0819 20.7437 11.7461 20.3295 11.7461L6.14168 11.7461L10.8546 7.03016C11.1474 6.73718 11.1473 6.2623 10.8543 5.9695C10.5613 5.6767 10.0864 5.67685 9.79362 5.96984L3.84392 11.9233C3.68134 12.0609 3.57812 12.2664 3.57812 12.4961L3.57813 12.4981Z" fill="#fff" />
                                                        </svg>
                                                    </button>
                                                    <div style={{ height: "341.6px", color: "#f5f5f5e2", borderLeft: "0.8px solid #8080802f", padding: "1rem", fontSize: "12px", fontWeight: "500", overflowY: "auto" }}>
                                                        {fileContent}
                                                    </div>
                                                </div>
                                            ) : (

                                                <table class="table table-hover">
                                                    <tbody>
                                                        {files.map((file) => (
                                                            <tr className="d-flex w-100 justify-content-between" key={file.fileName}>
                                                                <th scope="row">
                                                                    <span type="button" id="fileBtn" onClick={() => handleFileClick(file)}>
                                                                        <svg width="14" height="13" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.8923 16.7332C16.8923 17.9759 15.885 18.9832 14.6423 18.9832H6.34375C5.10111 18.9832 4.09375 17.9759 4.09375 16.7332V8.60187C4.09375 8.00538 4.33061 7.4333 4.75226 7.01138L9.10142 2.65951C9.52341 2.23725 10.0959 2 10.6929 2H14.6423C15.885 2 16.8923 3.00736 16.8923 4.25V16.7332ZM14.6423 17.4832C15.0566 17.4832 15.3923 17.1475 15.3923 16.7332V4.25C15.3923 3.83579 15.0565 3.5 14.6423 3.5H10.8227L10.8249 6.47969C10.8257 7.72296 9.81813 8.73129 8.57486 8.73129H5.59375V16.7332C5.59375 17.1475 5.92954 17.4832 6.34375 17.4832H14.6423ZM6.65314 7.23129L9.32349 4.55928L9.32486 6.48076C9.32516 6.89518 8.98928 7.23129 8.57486 7.23129H6.65314Z" fill="#f5f5f5" />
                                                                            <path d="M18.4065 5.68442C18.4065 5.27021 18.7423 4.93442 19.1565 4.93442C19.5707 4.93442 19.9065 5.27021 19.9065 5.68442V17.2514C19.9065 19.8747 17.7799 22.0014 15.1565 22.0014H7.79765C7.38344 22.0014 7.04765 21.6656 7.04765 21.2514C7.04765 20.8371 7.38344 20.5014 7.79765 20.5014H15.1565C16.9514 20.5014 18.4065 19.0463 18.4065 17.2514V5.68442Z" fill="#f5f5f5" />
                                                                        </svg>
                                                                        {file.fileName}
                                                                    </span>
                                                                </th>
                                                                <td style={{ textAlign: "right" }}>
                                                                    <span className="pl-0 pl-md-5">{commitMsg}</span>
                                                                </td>
                                                                <td>
                                                                    <span>{new Date(file.lastModified).toISOString().split("T")[0]}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='d-flex flex-column justify-content-center align-items-center h-75'>
                                            <img src="/no-data.svg" className="noDataImg" alt="no-data" />
                                            <p className='mb-0' style={{ fontSize: "12px" }}>no files to show</p>
                                        </div>
                                    )}

                                </div>

                                {lastUpdated && (
                                    <p style={{ fontSize: "10px", fontWeight: "500", textAlign: "end", marginBottom: "0", marginTop: "-11px", paddingRight: "5px", width: "100%" }}>
                                        Last updated: {new Date(lastUpdated).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div className="about">
                                <div>
                                    <p className='fw-semibold'>About</p>
                                    <p style={{ color: "whitesmoke", opacity: "0.9", fontSize: "14px !important" }}>{repo.description}</p>
                                </div>
                                <div>
                                    <div style={{ color: "#808080", fontSize: "12px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                        <p className='mb-0'>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.25 5C7.83579 5 7.5 5.33579 7.5 5.75V9.75C7.5 10.1642 7.83579 10.5 8.25 10.5H15.75C16.1642 10.5 16.5 10.1642 16.5 9.75V5.75C16.5 5.33579 16.1642 5 15.75 5H8.25ZM9 9V6.5H15V9H9Z" fill="#808080" />
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2C5.50736 2 4.5 3.00736 4.5 4.25V19C4.5 20.6569 5.84315 22 7.5 22H18.75C19.1642 22 19.5 21.6642 19.5 21.25C19.5 20.8358 19.1642 20.5 18.75 20.5H18V17.5H18.75C19.1642 17.5 19.5 17.1642 19.5 16.75V4.25C19.5 3.00736 18.4926 2 17.25 2H6.75ZM18 16V4.25C18 3.83579 17.6642 3.5 17.25 3.5H6.75C6.33579 3.5 6 3.83579 6 4.25V16.4013C6.44126 16.1461 6.95357 16 7.5 16H18ZM16.5 17.5V20.5H7.5C6.67157 20.5 6 19.8284 6 19C6 18.1716 6.67157 17.5 7.5 17.5H16.5Z" fill="#808080" />
                                            </svg>
                                            Readme
                                        </p>
                                        <p className='mb-0'>
                                            <svg width="18" height="18" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path d="M13.4073 3.25026C13.7628 3.25965 14.0627 3.51728 14.1257 3.8672L16.5642 17.4206L18.4564 13.0435C18.5751 12.7689 18.8456 12.5911 19.1448 12.5911H22.0234C22.4377 12.5911 22.7734 12.9269 22.7734 13.3411C22.7734 13.7553 22.4377 14.0911 22.0234 14.0911H19.6377L16.9546 20.2976C16.8234 20.6012 16.5087 20.783 16.1801 20.745C15.8515 20.7071 15.5866 20.4584 15.528 20.1328L13.2901 7.69366L11.239 16.4222C11.1675 16.7267 10.9146 16.9547 10.6044 16.9946C10.2942 17.0344 9.99191 16.8776 9.84581 16.6011L6.82861 10.891L5.4212 13.6791C5.29365 13.9317 5.03472 14.0911 4.75167 14.0911H1.87305C1.45883 14.0911 1.12305 13.7553 1.12305 13.3411C1.12305 12.9269 1.45883 12.5911 1.87305 12.5911H4.29014L6.14387 8.91892C6.27028 8.66849 6.52589 8.50955 6.80641 8.50694C7.08693 8.50432 7.34545 8.65848 7.47651 8.90651L10.2368 14.1302L12.6574 3.82844C12.7388 3.48233 13.0519 3.24088 13.4073 3.25026Z" fill="#808080" />
                                            </svg>
                                            Activity
                                        </p>
                                        <p className='mb-0'>
                                            <svg width="18" height="18" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9996 2.125C12.2851 2.125 12.5459 2.28707 12.6722 2.54308L15.3264 7.9211L21.2614 8.78351C21.5439 8.82456 21.7786 9.02244 21.8669 9.29395C21.9551 9.56546 21.8815 9.86351 21.6771 10.0628L17.3825 14.249L18.3963 20.16C18.4445 20.4414 18.3289 20.7257 18.0979 20.8936C17.867 21.0614 17.5608 21.0835 17.3081 20.9506L11.9996 18.1598L6.69122 20.9506C6.43853 21.0835 6.13233 21.0614 5.90137 20.8936C5.67041 20.7257 5.55475 20.4414 5.603 20.16L6.61682 14.249L2.32222 10.0628C2.11779 9.86351 2.04421 9.56546 2.13243 9.29395C2.22065 9.02244 2.45536 8.82456 2.73788 8.78351L8.67288 7.9211L11.3271 2.54308C11.4534 2.28707 11.7142 2.125 11.9996 2.125ZM11.9996 4.56966L9.84348 8.93853C9.73423 9.15989 9.52306 9.31331 9.27878 9.34881L4.45745 10.0494L7.94619 13.4501C8.12296 13.6224 8.20362 13.8706 8.16189 14.1139L7.33831 18.9158L11.6506 16.6487C11.8691 16.5338 12.1302 16.5338 12.3486 16.6487L16.661 18.9158L15.8374 14.1139C15.7957 13.8706 15.8763 13.6224 16.0531 13.4501L19.5418 10.0494L14.7205 9.34881C14.4762 9.31331 14.2651 9.15989 14.1558 8.93853L11.9996 4.56966Z" fill="#808080" />
                                            </svg>

                                            stars
                                        </p>
                                        <p className='mb-0'>
                                            <svg width="18" height="18" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0234 7.625C9.60719 7.625 7.64844 9.58375 7.64844 12C7.64844 14.4162 9.60719 16.375 12.0234 16.375C14.4397 16.375 16.3984 14.4162 16.3984 12C16.3984 9.58375 14.4397 7.625 12.0234 7.625ZM9.14844 12C9.14844 10.4122 10.4356 9.125 12.0234 9.125C13.6113 9.125 14.8984 10.4122 14.8984 12C14.8984 13.5878 13.6113 14.875 12.0234 14.875C10.4356 14.875 9.14844 13.5878 9.14844 12Z" fill="#808080" />
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0234 4.5C7.71145 4.5 3.99772 7.05632 2.30101 10.7351C1.93091 11.5375 1.93091 12.4627 2.30101 13.2652C3.99772 16.9439 7.71145 19.5002 12.0234 19.5002C16.3353 19.5002 20.049 16.9439 21.7458 13.2652C22.1159 12.4627 22.1159 11.5375 21.7458 10.7351C20.049 7.05633 16.3353 4.5 12.0234 4.5ZM3.66311 11.3633C5.12472 8.19429 8.32017 6 12.0234 6C15.7266 6 18.922 8.19429 20.3836 11.3633C20.5699 11.7671 20.5699 12.2331 20.3836 12.6369C18.922 15.8059 15.7266 18.0002 12.0234 18.0002C8.32017 18.0002 5.12472 15.8059 3.66311 12.6369C3.47688 12.2331 3.47688 11.7671 3.66311 11.3633Z" fill="#808080" />
                                            </svg>

                                            watching
                                        </p>
                                        <p className='mb-0'>
                                            <svg width="18" height="18" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.52344 2.75C4.52344 2.33579 4.85922 2 5.27344 2H8.27344C8.68765 2 9.02344 2.33579 9.02344 2.75V5.75C9.02344 6.16421 8.68765 6.5 8.27344 6.5H7.48438L7.48438 9.75H8.27344C8.68765 9.75 9.02344 10.0858 9.02344 10.5V11.25H15.0234V10.5C15.0234 10.0858 15.3592 9.75 15.7734 9.75H18.7734C19.1877 9.75 19.5234 10.0858 19.5234 10.5V13.5C19.5234 13.9142 19.1877 14.25 18.7734 14.25H18.0234V17.5H18.7734C19.1877 17.5 19.5234 17.8358 19.5234 18.25V21.25C19.5234 21.6642 19.1877 22 18.7734 22H15.7734C15.3592 22 15.0234 21.6642 15.0234 21.25V18.25C15.0234 17.8358 15.3592 17.5 15.7734 17.5H16.5234V14.25H15.7734C15.3592 14.25 15.0234 13.9142 15.0234 13.5V12.75H9.02344V13.5C9.02344 13.9142 8.68765 14.25 8.27344 14.25H5.27344C4.85922 14.25 4.52344 13.9142 4.52344 13.5V10.5C4.52344 10.0858 4.85922 9.75 5.27344 9.75H5.98438L5.98438 6.5H5.27344C4.85922 6.5 4.52344 6.16421 4.52344 5.75V2.75ZM16.5234 12.75H18.0234V11.25H16.5234V12.75ZM7.52344 11.25H6.02344V12.75H7.52344V11.25ZM7.52344 5V3.5H6.02344V5H7.52344ZM16.5234 19H18.0234V20.5H16.5234V19Z" fill="#808080" />
                                            </svg>

                                            forks
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Repo;
