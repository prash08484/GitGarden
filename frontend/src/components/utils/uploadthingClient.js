import { generateUploadButton } from "@uploadthing/react"; 

const url = import.meta.env.VITE_BASE_URI;

// Explicit URL, not the relative default — frontend (Vercel) and backend
// (Render) are different origins in production, and the /api proxy in
// vite.config.js only exists for local dev.
export const UploadButton = generateUploadButton({
  url: `${url}/api/uploadthing`,
});