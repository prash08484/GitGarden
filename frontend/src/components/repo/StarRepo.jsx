import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
const url = import.meta.env.VITE_BASE_URI;

function StarRepoPage() {
  const { id } = useParams();
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    const fetchStarredRepos = async () => {
      const res = await fetch(`${url}/user/${id}/starRepos`);
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    };
    fetchStarredRepos();
  }, [id]);

  return (
    <div>
      <h2>Starred Repositories</h2>
      {repos.length === 0 ? (
        <p>No starred repos yet.</p>
      ) : (
        <ul>
          {repos.map((repoId) => (
            <li key={repoId}>{repoId}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StarRepoPage