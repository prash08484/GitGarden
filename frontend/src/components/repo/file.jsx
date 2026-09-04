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
            <pre style={{ background: "#0c1110", color: "#fff", padding: "10px" }}>
              {fileContent}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};
