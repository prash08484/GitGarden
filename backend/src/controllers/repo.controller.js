import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../Navbar.jsx";
import { Link } from "react-router-dom";

const url = import.meta.env.VITE_BASE_URI;

function Dashboard() {
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const [isRepositoriesLoading, setIsRepositoriesLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      setRepositories([]);
      setSuggestedRepositories([]);
      return;
    }

    const fetchRepositories = async () => {
      try {
        setIsRepositoriesLoading(true);

        const response = await fetch(
          `${url}/repo/get/${userId}`
        );

        const data = await response.json();

        console.log("My repositories response:", data);

        /*
          A user having zero repositories is a valid state.
          Backend should ideally return:
          {
            repositories: []
          }
          with HTTP 200.

          But even if backend currently returns 404,
          don't let that crash the dashboard.
        */
        if (!response.ok) {
          console.error(
            "Failed to fetch user repositories:",
            data
          );

          setRepositories([]);
          return;
        }

        setRepositories(
          Array.isArray(data?.repositories)
            ? data.repositories
            : []
        );
      } catch (err) {
        console.error(
          "Error while fetching repositories:",
          err
        );

        setRepositories([]);
      } finally {
        setIsRepositoriesLoading(false);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        setIsSuggestionsLoading(true);

        const response = await fetch(
          `${url}/repo/allrepos`
        );

        const data = await response.json();

        console.log("Suggested repositories response:", data);

        if (!response.ok) {
          console.error(
            "Failed to fetch suggested repositories:",
            data
          );

          setSuggestedRepositories([]);
          return;
        }

        /*
          Depending on backend response, support either:
          
          [
            {...},
            {...}
          ]

          OR

          {
            repositories: [...]
          }
        */
        if (Array.isArray(data)) {
          setSuggestedRepositories(data);
        } else if (Array.isArray(data?.repositories)) {
          setSuggestedRepositories(data.repositories);
        } else {
          setSuggestedRepositories([]);
        }
      } catch (err) {
        console.error(
          "Error while fetching suggested repositories:",
          err
        );

        setSuggestedRepositories([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  /*
    Search only through the user's own repositories.
  */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(repositories);
      return;
    }

    const query = searchQuery.toLowerCase();

    const filteredRepos = repositories.filter((repo) =>
      String(repo?.name || "")
        .toLowerCase()
        .includes(query)
    );

    setSearchResults(filteredRepos);
  }, [searchQuery, repositories]);

  const visibleSuggestedRepositories =
    Array.isArray(suggestedRepositories)
      ? suggestedRepositories.filter(
          (repo) => repo?.visibility === true
        )
      : [];

  return (
    <>
      <Navbar />

      <section className="dashboard">
        {/* =========================
            LEFT / SUGGESTIONS PANEL
           ========================= */}
        <aside
          className={`custom-offcanvas ${
            isOpen ? "active" : ""
          }`}
        >
          <div className="suggest-heading">
            <h3>Suggestions</h3>

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Close suggestions"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.9545 5.95548C6.39384 5.51614 7.10616 5.51614 7.5455 5.95548L11.999 10.409L16.4524 5.95561C16.8918 5.51627 17.6041 5.51627 18.0434 5.95561C18.4827 6.39495 18.4827 7.10726 18.0434 7.5466C18.4827 6.39495 18.4827 7.10726 18.0434 7.5466L13.59 12L18.0434 16.4534C18.4827 16.8927 18.4827 17.605 18.0434 18.0444C17.6041 18.4837 16.8918 18.4837 16.4534 18.0444L11.999 13.591L7.5455 18.0445C7.10616 18.4839 6.39384 18.4839 5.9545 18.0445C5.51517 17.6052 5.51516 16.8929 5.9545 16.4535L10.408 12L5.9545 7.54647C5.51516 7.10713 5.51517 6.39482 5.9545 5.95548Z"
                  fill="#f1fdf6"
                />
              </svg>
            </button>
          </div>

          <div className="suggested-repo">
            {isSuggestionsLoading ? (
              <div className="d-flex align-items-center justify-content-center gap-2 h-100">
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                />
                <span role="status">Loading...</span>
              </div>
            ) : visibleSuggestedRepositories.length > 0 ? (
              visibleSuggestedRepositories.map((repo) => (
                <div className="repo-div" key={repo._id}>
                  <Link
                    id="repo-name"
                    to={`/repo/${repo._id}`}
                  >
                    <h4 className="mb-0">
                      {repo?.name || "Unnamed repository"}
                    </h4>
                  </Link>

                  <span
                    style={{
                      fontSize: "9px",
                      color: "#808080",
                    }}
                  >
                    owner: @
                    {repo?.owner?.username || "Unknown user"}
                  </span>
                </div>
              ))
            ) : (
              <p>No suggested repositories available.</p>
            )}
          </div>

          <hr
            className="suggested-events"
          />

          <div className="suggested-events">
            <h3 style={{ marginBottom: "0.5rem" }}>
              Upcoming Events
            </h3>

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

        {/* =========================
              MAIN REPOSITORY AREA
           ========================= */}
        <main className="d-flex flex-column">
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.8rem",
              }}
            >
              <button
                onClick={() => setIsOpen(true)}
                className="open-offcanvas"
                type="button"
              >
                <p>
                  ☰{" "}
                  <span className="suggestion-btn-line">
                    Suggestions
                  </span>
                </p>
              </button>

              <h2>Your Repositories</h2>
            </div>

            <div id="search">
              <input
                type="text"
                value={searchQuery}
                placeholder="Search..."
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>

            <hr
              className="mt-0 mb-3 mx-1"
              style={{
                color: "gray",
                opacity: "0.11",
              }}
            />
          </div>

          <div className="main-repos">
            {isRepositoriesLoading ? (
              <div className="d-flex align-items-center justify-content-center gap-2 h-100">
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                />
                <span role="status">
                  Loading...
                </span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((repo) => (
                <div
                  className="search-repo-div"
                  key={repo._id}
                >
                  <Link
                    id="repo-name"
                    to={`/repo/${repo._id}`}
                  >
                    <h4>
                      {repo?.name ||
                        "Unnamed repository"}
                    </h4>
                  </Link>

                  <p
                    style={{
                      color: "#808080",
                    }}
                  >
                    Created on:{" "}
                    {repo?.createdAt
                      ? new Date(
                          repo.createdAt
                        ).toLocaleDateString()
                      : "Unknown date"}
                  </p>

                  <p
                    style={{
                      color: "#808080",
                      marginBottom: 0,
                    }}
                  >
                    {repo?.description || ""}
                  </p>
                </div>
              ))
            ) : (
              <p>
                {searchQuery.trim()
                  ? "No repositories match your search."
                  : "No repo yet. Create a repo."}
              </p>
            )}
          </div>
        </main>

        {/* =========================
              RIGHT EVENTS PANEL
           ========================= */}
        <aside>
          <h3
            style={{
              marginBottom: "0.5rem",
              marginTop: "0",
            }}
          >
            Upcoming Events
          </h3>

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
  );
}

export default Dashboard;