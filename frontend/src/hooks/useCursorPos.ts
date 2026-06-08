import { useCallback, useEffect, useState } from "react";

export const useCursorPos = (
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
) => {
  const [cursorPos, setCursorPos] = useState(0);

  const setCursorPosSafe = useCallback(
    (pos: number) => {
      if (ref.current) {
        ref.current.selectionStart = pos;
        ref.current.selectionEnd = pos;
      }
    },
    [ref],
  );

  useEffect(() => {
    const onSelectionChange = () => {
      if (ref.current && document.activeElement === ref.current) {
        setCursorPos(ref.current.selectionStart ?? 0);
      }
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [ref]);

  return { cursorPos, setCursorPos: setCursorPosSafe };
};
