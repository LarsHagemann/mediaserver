import { FileTypePlugin } from "@lars_hagemann/mediaserver-backend-plugin-types";
import * as fs from "fs";

const plugin: FileTypePlugin = {
  matcher: (file) => file.startsWith("text/plain"),
  thumbnailCreator: async ({ uuidv4 }) => {
    const tmpId = uuidv4();
    const fromPath = "/plainTextThumbnail.jpg";
    const tmpPath = "/tmp/" + tmpId + "_thumbnail.jpg";
    await fs.promises.copyFile(fromPath, tmpPath);

    return { path: tmpPath };
  },
  description: "Plain text file support",
};

export default plugin;
