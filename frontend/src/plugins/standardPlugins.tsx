import type { FileTypePlugin } from "./plugin";

export const pdfPlugin: FileTypePlugin = {
  matcher: (type) => type === "application/pdf",
  icon: (icons) => icons.FaFilePdf,
  description: "Plugin for rendering PDF files",
  Render: ({ objectUrl }) => (
    <embed className="w-full h-full" src={objectUrl} type="application/pdf" />
  ),
  Diashow: (context) => {
    context.React.useEffect(() => {
      const timeout = setTimeout(() => {
        context.nextDocument();
      }, context.defaultTimeout);

      return () => clearTimeout(timeout);
    }, [context]);

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
  Render: ({ objectUrl }) => (
    <img
      className="w-full h-full object-contain"
      src={objectUrl}
      alt="Image Preview"
    />
  ),
  Diashow: (context) => {
    context.React.useEffect(() => {
      const timeout = setTimeout(() => {
        context.nextDocument();
      }, context.defaultTimeout);

      return () => clearTimeout(timeout);
    }, [context]);

    return (
      <img
        className="w-full h-full object-contain"
        src={context.objectUrl}
        alt="Image Preview"
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
    const videoRef = context.React.useRef<HTMLVideoElement>(null);

    context.React.useEffect(() => {
      videoRef.current?.play();

      videoRef.current?.addEventListener("ended", () => {
        context.nextDocument();
      });
    }, [context]);

    return (
      <video
        className="w-full h-full"
        src={context.objectUrl}
        controls
        loop={false}
        ref={videoRef}
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
    const audioRef = context.React.useRef<HTMLAudioElement>(null);

    context.React.useEffect(() => {
      audioRef.current?.play();

      audioRef.current?.addEventListener("ended", () => {
        context.nextDocument();
      });
    }, [context]);

    return (
      <audio
        className="w-full h-full"
        src={context.objectUrl}
        controls
        loop={false}
        ref={audioRef}
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
