import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  isLoading: boolean;
  delay?: number;
};

export const IndeterminateProgressBar: React.FC<Props> = ({
  className,
  isLoading,
  delay = 100,
}) => {
  const [state, setState] = useState<"idle" | "loading" | "completing">("idle");
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (isLoading) {
      showTimerRef.current = setTimeout(() => {
        setState("loading");
      }, delay);
      return () => {
        if (showTimerRef.current) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
      };
    } else {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (stateRef.current === "loading") {
        setState("completing");
        const timer = setTimeout(() => setState("idle"), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, delay]);

  if (state === "idle") {
    return null;
  }

  return (
    <div
      className={twMerge(
        "w-full h-1 bg-transparent overflow-hidden",
        className,
      )}
    >
      <div
        className={twMerge(
          "h-full bg-accent",
          state === "loading" && "animate-indeterminate-progress",
          state === "completing" && "animate-progress-complete",
        )}
      />
    </div>
  );
};
