import sharp from "sharp";
import type { FileTypePlugin } from "./plugin.js";
import * as pdf from "pdf-thumbnail";
import * as fs2 from "fs";
import ffmpeg from "ffmpeg";

export const pdfPlugin: FileTypePlugin = {
  matcher: (file) => file === "application/pdf",
  description: "Plugin for PDF files",
  thumbnailCreator: async ({ path, uuidv4 }) => {
    const tmpId = uuidv4();
    const pdfBuffer = fs2.createReadStream(path);
    const pdfThumbnailStream = await pdf.default(pdfBuffer, {
      resize: { width: 120, height: 120 },
      crop: {
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        ratio: true,
      },
      compress: { type: "JPEG" },
    });
    const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfThumbnailStream.on("data", (chunk) => chunks.push(chunk));
      pdfThumbnailStream.on("end", () => resolve(Buffer.concat(chunks)));
      pdfThumbnailStream.on("error", reject);
    });
    const tmpPath = "/tmp/" + tmpId + "_thumbnail.jpg";
    fs2.writeFileSync(tmpPath, thumbnailBuffer);
    return { path: tmpPath };
  },
  initialTags: async () => {
    return [];
  },
};

export const imagePlugin: FileTypePlugin = {
  matcher: (file) => file.startsWith("image"),
  description: "Plugin for image files",
  thumbnailCreator: async ({ path, uuidv4 }) => {
    // Implement image thumbnail creation logic
    const tmpId = uuidv4();
    const tmpPath = "/tmp/" + tmpId + "_thumbnail.jpg";
    await sharp(path)
      .rotate()
      .resize(120, 120, {
        fit: "inside",
      })
      .jpeg({ mozjpeg: true })
      .toFile(tmpPath);

    return { path: tmpPath };
  },
  initialTags: async () => {
    return [];
  },
};

export const videoPlugin: FileTypePlugin = {
  matcher: (file) => file.startsWith("video"),
  description: "Plugin for video files",
  thumbnailCreator: async ({ path, uuidv4 }) => {
    const process = await new ffmpeg(path);
    const filename = uuidv4();
    await process.fnExtractFrameToJPG("/tmp", {
      number: 1,
      every_n_percentage: 50,
      file_name: filename + ".jpg",
      size: "120x120",
    });

    return { path: "/tmp/" + filename + "_1.jpg" };
  },
  initialTags: async () => {
    return [];
  },
};

export const audioPlugin: FileTypePlugin = {
  matcher: (file) => file.startsWith("audio"),
  description: "Plugin for audio files",
  thumbnailCreator: async ({ path, uuidv4 }) => {
    const process = await new ffmpeg(path);
    const filename = uuidv4();
    process.addFilterComplex(
      "[0:a]aformat=channel_layouts=mono," +
        "compand=gain=-6," +
        "showwavespic=s=120x120:colors=#9cf42f[fg];" +
        "color=s=120x120:color=#44582c," +
        "drawgrid=width=iw/10:height=ih/5:color=#9cf42f@0.1[bg];" +
        "[bg][fg]overlay=format=auto,drawbox=x=(iw-w)/2:y=(ih-h)/2:w=iw:h=1:color=#9cf42f",
    );
    process.addCommand("-frames:v", "1");
    await process.save("/tmp/" + filename + ".jpg");

    return { path: "/tmp/" + filename + ".jpg" };
  },
  initialTags: async () => {
    return [];
  },
};

export const standardPlugins = {
  pdf: pdfPlugin,
  image: imagePlugin,
  video: videoPlugin,
  audio: audioPlugin,
};
