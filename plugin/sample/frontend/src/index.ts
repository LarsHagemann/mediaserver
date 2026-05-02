import type { FileTypePlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";

const plugin: FileTypePlugin = {
  matcher: (fileType) => fileType === "text/plain",
  icon: (ReactIcons) => ReactIcons.FaFileAlt,
  Render: (context) => {
    context.React.useEffect(() => {
      console.log("This worked!");
    }, []);

    return context.React.createElement("iframe", {
      className: "w-full h-full",
      src: context.objectUrl,
      title: "Plain Text Preview",
    });
  },
  Diashow: () => null,
  description: "Renderer plugin for plain text files",
};

export default plugin;
