import { useState, useEffect } from "react";
import Navbar from "../Navbar";
import { authHeaders } from "../utils/api";
import "./cliTokens.css";

const url = import.meta.env.VITE_BASE_URI;

function CliTokens() {
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState(null); // shown once, right after creation
  const [copied, setCopied] = useState(false);

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
      setCopied(false);
      setLabel("");
      fetchTokens();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  const handleRevoke = async (tokenId) => {
    const res = await fetch(`${url}/cli-tokens/${tokenId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) fetchTokens();
  };

  return (
    <>
      <Navbar />
      <div className="cliTokensPage">
        <h2>CLI tokens</h2>
        <p>
          Authenticate <code>git-garden</code> on your machine. Run{" "}
          <code>git-garden login</code> in your terminal and paste a token
          generated here.
        </p>

        {newToken && (
          <div className="tokenReveal">
            <strong>Copy this token now — it won't be shown again.</strong>
            <pre>{newToken}</pre>
            <button className="btn-primary" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        <form className="tokenForm" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Label, e.g. work laptop"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            Generate new token
          </button>
        </form>

        {tokens.length === 0 ? (
          <div className="tokenEmpty">No CLI tokens yet.</div>
        ) : (
          <ul className="tokenList">
            {tokens.map((t) => (
              <li className="tokenRow" key={t._id}>
                <div className="tokenRow-info">
                  <div className="tokenRow-label">{t.label}</div>
                  <div className="tokenRow-meta">
                    {t.tokenPrefix}&hellip; &middot;{" "}
                    {t.lastUsedAt
                      ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                      : "never used"}
                  </div>
                </div>
                <button className="btn-danger" onClick={() => handleRevoke(t._id)}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default CliTokens;
