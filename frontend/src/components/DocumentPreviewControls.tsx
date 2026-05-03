import type React from "react";
import { FaCaretLeft, FaCaretRight, FaDownload } from "react-icons/fa";
import { LuPresentation } from "react-icons/lu";
import { useIsMobileScreen } from "../hooks/useIsMobileScreen";
import { MdClose } from "react-icons/md";
import { FaBookmark } from "react-icons/fa6";

type Props = {
  nextDocument: () => void;
  previousDocument: () => void;
  downloadDocument: () => void;
  toggleDiashow: () => void;
  onBookmark: () => void;
  onClose: () => void;
};

export const DocumentPreviewControls: React.FC<Props> = ({
  nextDocument,
  previousDocument,
  downloadDocument,
  toggleDiashow,
  onBookmark,
  onClose,
}) => {
  const isMobile = useIsMobileScreen();

  const normalControlSize = isMobile ? "1.25rem" : "2rem";
  const smallControlSize = isMobile ? "1rem" : "1.5rem";

  return (
    <div
      className="flex flex-row justify-between px-2 items-center w-full h-full"
    >
      <div />
      <div className="flex flex-row justify-center items-center gap-4">
        <div
          className="rounded-md p-2 cursor-pointer hover:text-text-muted duration-200"
          onClick={() => {
            previousDocument();
          }}
        >
          <FaCaretLeft size={normalControlSize} />
        </div>
        <div
          className="rounded-md p-3 cursor-pointer hover:text-text-muted duration-200"
          onClick={() => {
            downloadDocument();
          }}
        >
          <FaDownload size={smallControlSize} />
        </div>
        <div
          className="rounded-md p-2 cursor-pointer hover:text-text-muted duration-200"
          onClick={() => {
            toggleDiashow();
          }}
        >
          <LuPresentation size={smallControlSize} />
        </div>
        <div
          className="rounded-md p-2 cursor-pointer hover:text-text-muted duration-200"
          onClick={() => {
            onBookmark();
          }}
        >
          <FaBookmark size={smallControlSize} />
        </div>
        <div
          className="rounded-md p-2 cursor-pointer hover:text-text-muted duration-200"
          onClick={() => {
            nextDocument();
          }}
        >
          <FaCaretRight size={normalControlSize} />
        </div>
      </div>
      <MdClose
        className="z-100 text-3xl cursor-pointer duration-200 hover:text-danger-subtle"
        onClick={onClose}
      />
    </div>
  )
};
