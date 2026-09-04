import React from "react";
import "./issuemodal.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
const url = import.meta.env.VITE_BASE_URI;

export default function IssueModal({ issue, onClose, type, fetchIssues }) {
  if (!issue) return null;
  const currUser = localStorage.getItem("userId");
  const navigate = useNavigate();

  const handleIssueChange = (e) => {
    const { name, value } = e.target;
    setIssueValues((prev) => ({ ...prev, [name]: value }));
  };

  const [issueValues, setIssueValues] = useState({
    title: "",
    description: "",
  });

  const saveChanges = async (e) => {
    e.preventDefault();
    try {
      const result = await fetch(`${url}/issue/${issue._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueValues),
      });

      if (result.status == 200) {
        toast.success("Issue updated successfully!");
        onClose();
      } else {
        toast.error("Update failed!");
      }
    } catch (err) {
      console.error("saveChanges error: ", err);
      toast.error("Something went wrong!");
    } finally {
      fetchIssues();
    }
  };

  const deleteIssue = async (id) => {
    try {
      const result = await fetch(`${url}/issue/${id}`, { method: "DELETE" });

      if (result.status == 200) {
        toast.success("repo deleted successfully");
        onClose();
        navigate(`/profile/${currUser}`);
      }
    } catch (e) {
      console.log(e);
      toast.error("something went wrong!");
    } finally {
      fetchIssues();
    }
  }


  useEffect(() => {
    if (issue) {
      setIssueValues({
        title: issue.title || "",
        description: issue.description || "",
      });
    }
  }, [issue]);


  let modalContent;
  if (type === "details") {
    modalContent = (
      <div className="custom-modal-overlay" onClick={onClose}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()}>

          <div className="modal-header details-modal-header">
            <div className="d-flex justify-content-between w-100">
              <span className={`issue-status-badge ${issue.status === 'open' ? 'badge-open' : 'badge-closed'}`}>
                {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
              </span>
              <button className="modal-close-btn" onClick={onClose}>✕</button>
            </div>
            <div>
              <h4 className="issue-title mt-2">{issue.title}</h4>
              <p className="issue-description">{issue.description}</p>
            </div>
          </div>

          <div className="modal-body">
            <div className="issue-meta">
              <div className="meta-row">
                <span className="meta-label">ID</span>
                <span className="meta-value meta-mono">
                  {issue._id.slice(0, 8)}...{issue._id.slice(-5)}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Created</span>
                <span className="meta-value">
                  {new Date(issue.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Repo</span>
                <Link
                  className="meta-link"
                  to={`/repo/${issue.repository._id}`}
                  onClick={(e) => {
                    if (issue.repository.visibility === false && currUser !== issue.repository.owner._id.toString()) {
                      e.preventDefault();
                      toast.error("This is a private repository!");
                    }
                  }}
                >
                  {issue.repository.name}
                </Link>
              </div>
              <div className="meta-row">
                <span className="meta-label">Author</span>
                <Link className="meta-link" to={`/profile/${issue.createdBy._id}`}>
                  @{issue.createdBy.username}
                </Link>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: "0.8px solid #808080ac", paddingTop: "1rem" }}>
            <button id="cancel-btn" onClick={onClose}>Close</button>
            <button
              id="cancel-btn"
              onClick={() => {
                toast.success("ID copied!");
                navigator.clipboard.writeText(issue._id);
                onClose();
              }}
            >
              Copy ID
            </button>
          </div>

        </div>
      </div>
    )
  } else if (type === "delete") {
    modalContent = (
      <div className="custom-modal-overlay" onClick={onClose}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()} >
          <div className="modal-header">
            <h2 className="modal-title">Delete Issue</h2>
          </div>

          <div className="modal-body">
            <p>Do you really want to delete this issue?</p>
          </div>
          <div className="modal-footer">
            <button type="button" class="fw-semibold px-3" id="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" class="btn fw-semibold px-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#ff0000", color: "whitesmoke", border: "none" }} onClick={() => deleteIssue(issue._id)}>Delete</button>
          </div>
        </div>
      </div>
    )
  } else {
    modalContent = (
      <div className="custom-modal-overlay" onClick={onClose}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()} >
          <div className="modal-header">
            <h2 className="modal-title">Issue Details</h2>
          </div>

          <div className="modal-body">
            <form className="edit-repo-form" onSubmit={saveChanges}>
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
                <button type="button" class="fw-semibold px-4 d-flex" id="cancel-btn" onClick={onClose}>Cancel</button>
                <button type="submit" class="btn fw-semibold px-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: "green", color: "whitesmoke", border: "1px solid green" }}>Add</button>
              </span>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {modalContent}
    </>
  );
}
