import { useState } from "react";

const FileList = ({ files }) => {

  return (
    <div style={{ display: "flex" }}>
      <ul style={{ width: "200px" }}>
        {files.map(file => (
          <li key={file.key} onClick={() => handleClick(file)}>
            {file.fileName}
          </li>
        ))}
      </ul>
      <div style={{ marginLeft: "20px", flex: 1 }}>
        {selectedFile && (
          <>
            <h3>{selectedFile}</h3>
            <pre style={{ background: "var(--gh-panel)", border: "1px solid var(--gh-border)", color: "var(--gh-text)", padding: "10px", borderRadius: "6px" }}>
              {fileContent}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};