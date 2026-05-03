import {
  FaChevronLeft,
  FaChevronRight,
  FaPause,
  FaPlay,
} from "react-icons/fa6";
import { IconButton } from "./IconButton";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  nextDocument: () => void;
  previousDocument: () => void;
  togglePause: () => void;
  setTimeoutValue: (timeout: number) => void;
  timeout: number;
  paused: boolean;
};

const MOUSE_MOVE_HIDE_DELAY = 250;

export const DocumentDiashowControls = ({
  nextDocument,
  previousDocument,
  togglePause,
  setTimeoutValue,
  timeout,
  paused,
}: Props) => {
  const [lastMouseMoveTimestamp, setLastMouseMoveTimestamp] = useState(
    Date.now(),
  );
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = () => {
      setLastMouseMoveTimestamp(Date.now());
      setVisible(true);
    };

    const interval = setInterval(() => {
      if (Date.now() - lastMouseMoveTimestamp > MOUSE_MOVE_HIDE_DELAY) {
        setVisible(false);
      }
    }, 100);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [lastMouseMoveTimestamp]);

  return (
    <div
      className={twMerge(
        "absolute bottom-0 left-0 flex justify-center gap-4 bg-surface-2 w-full p-2 transition-opacity duration-300",
        visible || hovered ? "opacity-100" : "opacity-0",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <IconButton
        onClick={previousDocument}
        className="bg-surface-1 rounded-full p-2 hover:bg-surface-3"
      >
        <FaChevronLeft size={16} />
      </IconButton>
      <IconButton
        onClick={togglePause}
        className="bg-surface-1 rounded-full p-2 hover:bg-surface-3"
      >
        {paused ? <FaPlay size={16} /> : <FaPause size={16} />}
      </IconButton>
      <IconButton
        onClick={nextDocument}
        className="bg-surface-1 rounded-full p-2 hover:bg-surface-3"
      >
        <FaChevronRight size={16} />
      </IconButton>
      <div>
        <input
          type="number"
          value={timeout}
          onChange={(e) => setTimeoutValue(Number(e.target.value))}
          className="ml-4 w-16 bg-surface-1 rounded p-1 text-center"
          min={1}
        />
        <span className="ml-1 text-sm text-text-secondary">ms</span>
      </div>
    </div>
  );
};
