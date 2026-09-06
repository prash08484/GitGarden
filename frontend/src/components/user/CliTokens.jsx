import { useState, useEffect } from "react";
import { authHeaders } from "../utils/api";

const url = import.meta.env.VITE_BASE_URI;

function CliTokens() {
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState(null); // shown once, right after creation

  const fetchTokens = async () => {
    const res = await fetch(`${url}/cli-tokens`, { headers: authHeaders() });
    if (res.ok) setTokens(await res.json());
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch(`${url}/cli-tokens`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewToken(data.token); // full raw token — only ever shown this once
      setLabel("");
      fetchTokens();
    }
  };

  const handleRevoke = async (tokenId) => {
    const res = await fetch(`${url}/cli-tokens/${tokenId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) fetchTokens();
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
      <h3>CLI Tokens</h3>
      <p>
        Use a CLI token to authenticate <code>push</code>/<code>pull</code>/<code>revert</code> from
        your terminal. Run <code>git-garden login</code> and paste it in.
      </p>

      {newToken && (
        <div style={{ border: "1px solid #f5a623", padding: "1rem", marginBottom: "1rem" }}>
          <strong>Copy this now — you won't be able to see it again:</strong>
          <pre style={{ userSelect: "all", overflowWrap: "break-word" }}>{newToken}</pre>
          <button onClick={() => setNewToken(null)}>I've copied it</button>
        </div>
      )}

      <form onSubmit={handleCreate} style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Label (e.g. 'work laptop')"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="submit">Generate new token</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tokens.map((t) => (
          <li key={t._id} style={{ marginBottom: "0.5rem" }}>
            {t.label} — {t.tokenPrefix}...{" "}
            <span style={{ color: "#888" }}>
              {t.lastUsedAt ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}` : "never used"}
            </span>{" "}
            <button onClick={() => handleRevoke(t._id)}>Revoke</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CliTokens;