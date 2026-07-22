import { ZoomableImage } from "../components/ZoomableImage";
import type { FileTypePlugin } from "./plugin";

export const pdfPlugin: FileTypePlugin = {
  matcher: (type) => type === "application/pdf",
  icon: (icons) => icons.FaFilePdf,
  description: "Plugin for rendering PDF files",
  Render: ({ objectUrl }) => (
    <embed className="w-full h-full" src={objectUrl} type="application/pdf" />
  ),
  Diashow: (context) => {
    return (
      <embed
        className="w-full h-full"
        src={context.objectUrl}
        type="application/pdf"
      />
    );
  },
};

export const imagePlugin: FileTypePlugin = {
  matcher: (type) => type.startsWith("image"),
  icon: (icons) => icons.FaImage,
  description: "Plugin for rendering image files",
  Render: ({ objectUrl, onZoomedChange }) => (
    <ZoomableImage
      src={objectUrl}
      alt="Image Preview"
      onZoomedChange={onZoomedChange}
    />
  ),
  Diashow: (context) => {
    return (
      <ZoomableImage
        src={context.objectUrl}
        alt="Image Preview"
        // Zooming into a slide pauses auto-advance so it doesn't move on.
        onZoomedChange={(zoomed) => {
          if (zoomed) context.preventAutoAdvance();
        }}
      />
    );
  },
};

export const videoPlugin: FileTypePlugin = {
  matcher: (type) => type.startsWith("video"),
  icon: (icons) => icons.FaVideo,
  description: "Plugin for rendering video files",
  fetchMode: "stream",
  Render: ({ objectUrl }) => (
    <video className="w-full h-full" src={objectUrl} controls />
  ),
  Diashow: (context) => {
    context.preventAutoAdvance();

    return (
      <video
        className="w-full h-full"
        src={context.objectUrl}
        controls
        loop={false}
      />
    );
  },
};

export const audioPlugin: FileTypePlugin = {
  matcher: (type) => type.startsWith("audio"),
  icon: (icons) => icons.FaFileAudio,
  description: "Plugin for rendering audio files",
  fetchMode: "stream",
  Render: ({ objectUrl }) => (
    <audio className="w-full h-full" src={objectUrl} controls />
  ),
  Diashow: (context) => {
    context.preventAutoAdvance();

    return (
      <audio
        className="w-full h-full"
        src={context.objectUrl}
        controls
        loop={false}
      />
    );
  },
};

export const standardPlugins = [
  imagePlugin,
  videoPlugin,
  pdfPlugin,
  audioPlugin,
];

export const unsupportedTypePlugin: FileTypePlugin = {
  matcher: () => true,
  icon: (icons) => icons.FaFile,
  description: "Plugin for unsupported file types",
  Render: () => <div>Unsupported file type</div>,
  Diashow: (context) => {
    context.React.useEffect(() => {
      context.nextDocument();
    }, [context]);

    return <div>Unsupported file type</div>;
  },
};
