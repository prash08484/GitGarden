import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../Navbar.jsx";
import { Link } from 'react-router-dom';
const url = import.meta.env.VITE_BASE_URI;

function Dashboard() {

  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchRepositories = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `${url}/repo/get/${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Repository fetch failed:", data);

          // No repositories is still a valid dashboard state
          setRepositories([]);
          return;
        }

        setRepositories(data.repositories || []);
      } catch (err) {
        console.error("Error while fetching repositories:", err);
        setRepositories([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${url}/repo/allrepos`);
        const data = await response.json();
        setSuggestedRepositories(data);
      } catch (err) {
        console.error("Error while fecthing repositories: ", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  useEffect(() => {
    if (searchQuery == "") {
      setSearchResults(repositories);
    } else {
      const filteredRepo = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredRepo);
    }
  }, [searchQuery, repositories]);


  return (
    <>
      <Navbar />
      <section className="dashboard">
        <aside className={`custom-offcanvas ${isOpen ? "active" : ""}`}>
          <div className="suggest-heading">
            <h3>Suggestions</h3>
            <button onClick={() => setIsOpen(false)}>

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                <path d="M5.9545 5.95548C6.39384 5.51614 7.10616 5.51614 7.5455 5.95548L11.999 10.409L16.4524 5.95561C16.8918 5.51627 17.6041 5.51627 18.0434 5.95561C18.4827 6.39495 18.4827 7.10726 18.0434 7.5466L13.59 12L18.0434 16.4534C18.4827 16.8927 18.4827 17.605 18.0434 18.0444C17.6041 18.4837 16.8918 18.4837 16.4524 18.0444L11.999 13.591L7.5455 18.0445C7.10616 18.4839 6.39384 18.4839 5.9545 18.0445C5.51517 17.6052 5.51516 16.8929 5.9545 16.4535L10.408 12L5.9545 7.54647C5.51516 7.10713 5.51517 6.39482 5.9545 5.95548Z" fill="#f1fdf6" />
              </svg>


            </button>
          </div>
          <div className="suggested-repo">
            {suggestedRepositories.filter(repo => repo.visibility).length > 0 && (
              suggestedRepositories
                .filter(repo => repo.visibility)
                .map((repo) => {
                  return (
                    <div className="repo-div" key={repo._id}>
                      <Link id='repo-name' to={`/repo/${repo._id}`}>
                        <h4 className="mb-0">{repo.name}</h4>
                      </Link>
                      <span style={{ fontSize: "9px", color: "#808080" }}>owner: @{repo.owner?.username || "Unknown user"}</span>
                    </div>
                  )
                })
            )}

            {(suggestedRepositories.filter(repo => repo.visibility).length === 0) && (isLoading === false) && (
              <p>No suggested repositories available.</p>
            )}

            {isLoading && (
              <div className="d-flex align-items-center justify-content-center gap-2 h-100">
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span role="status">Loading...</span>
              </div>
            )}
          </div>

          <hr className="suggested-events" />
          <div className="suggested-events">

            <h3 style={{ marginBottom: "0.5rem" }}>Upcoming Events</h3>
            <ul className="event-listing">
              <li>
                <p>Tech Conference - Dec 15</p>
              </li>
              <li>
                <p>Developer Meetup - Dec 25</p>
              </li>
              <li>
                <p>React Summit - Jan 5</p>
              </li>
            </ul>

          </div>
        </aside>
        <main className="d-flex flex-column">

          <div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <button onClick={() => setIsOpen(true)} className="open-offcanvas">
                <p>
                  ☰ <span className="suggestion-btn-line">Suggestions</span>
                </p>
              </button>
              <h2>Your Repositories</h2>
            </div>

            <div id="search">
              <input
                type="text"
                value={searchQuery}
                placeholder="Search..."
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <hr className="mt-0 mb-3 mx-1" style={{ color: "gray", opacity: "0.11" }} />

          </div>

          <div className="main-repos">

            {(searchResults) && (searchResults.length > 0) && (
              searchResults.map((repo) => (
                <div className="search-repo-div" key={repo._id}>
                  <Link id="repo-name" to={`/repo/${repo._id}`}>
                    <h4>{repo.name}</h4>
                  </Link>
                  <p style={{ color: "#808080" }}>
                    Created on: {new Date(repo.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}

            {(searchResults.length === 0) && (isLoading === false) && (
              <p>No repo yet. Create a repo</p>
            )}

            {isLoading && (
              <div className="d-flex align-items-center justify-content-center gap-2 h-100">
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span role="status">Loading...</span>
              </div>
            )}

          </div>
        </main>
        <aside>
          <h3 style={{ marginBottom: "0.5rem", marginTop: "0" }}>Upcoming Events</h3>
          <ul className="event-listing">
            <li>
              <p>Tech Conference - Dec 15</p>
            </li>
            <li>
              <p>Developer Meetup - Dec 25</p>
            </li>
            <li>
              <p>React Summit - Jan 5</p>
            </li>
          </ul>
        </aside>
      </section>
    </>
  )
}

export default Dashboard;