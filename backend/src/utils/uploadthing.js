import { createUploadthing } from "uploadthing/server"

const f = createUploadthing();
const fileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(({ file }) => {
      console.log("File uploaded:", file.url);
      return { url: file.url };
    }),
};

export default fileRouter;