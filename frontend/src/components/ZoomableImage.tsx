import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DOUBLE_CLICK_SCALE = 2.5;
const WHEEL_SENSITIVITY = 0.0015;

type Transform = { scale: number; x: number; y: number };

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Keeps the (scaled) image box covering the container. The image element fills
 * the container at scale 1, so once zoomed its box spans `size * scale` and may
 * be translated within `[size * (1 - scale), 0]`. At scale 1 this collapses to
 * the identity transform, which is what lets swipe-to-navigate take over again.
 */
const clampTransform = (
  { scale, x, y }: Transform,
  width: number,
  height: number,
): Transform => {
  const clampedScale = clamp(scale, MIN_SCALE, MAX_SCALE);
  if (clampedScale <= MIN_SCALE) {
    return IDENTITY;
  }
  return {
    scale: clampedScale,
    x: clamp(x, width * (1 - clampedScale), 0),
    y: clamp(y, height * (1 - clampedScale), 0),
  };
};

/**
 * Zooms `from` by `factor` while keeping the content point under
 * (`focalX`, `focalY`) — both relative to the container's top-left — fixed.
 */
const zoomAt = (
  from: Transform,
  focalX: number,
  focalY: number,
  factor: number,
  width: number,
  height: number,
): Transform => {
  const scale = clamp(from.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / from.scale;
  return clampTransform(
    {
      scale,
      x: focalX - (focalX - from.x) * ratio,
      y: focalY - (focalY - from.y) * ratio,
    },
    width,
    height,
  );
};

const distance = (a: React.Touch, b: React.Touch) =>
  Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

type Props = {
  src: string;
  alt?: string;
  className?: string;
  /** Notified whenever the image crosses between zoomed (> 1×) and not. */
  onZoomedChange?: (zoomed: boolean) => void;
};

/**
 * An image that can be zoomed and panned. It only intercepts pointer/touch
 * gestures while zoomed in, so the surrounding swipe-to-navigate container keeps
 * working at the default 1× scale.
 */
export const ZoomableImage = ({
  src,
  alt,
  className,
  onZoomedChange,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const zoomed = transform.scale > MIN_SCALE;

  // Reset when the displayed image changes.
  useEffect(() => {
    setTransform(IDENTITY);
  }, [src]);

  // Notify only on transitions, regardless of `onZoomedChange` identity.
  const prevZoomed = useRef(zoomed);
  useEffect(() => {
    if (prevZoomed.current !== zoomed) {
      prevZoomed.current = zoomed;
      onZoomedChange?.(zoomed);
    }
  });

  const rect = () => containerRef.current?.getBoundingClientRect();

  // Wheel zoom. Attached natively so we can preventDefault (React's onWheel is
  // passive and would let the page scroll while zooming).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = el.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY);
      setTransform((prev) =>
        zoomAt(
          prev,
          event.clientX - bounds.left,
          event.clientY - bounds.top,
          factor,
          bounds.width,
          bounds.height,
        ),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Clean up any in-flight mouse-drag listeners on unmount.
  const stopMouseDrag = useRef<() => void>(() => {});
  useEffect(() => () => stopMouseDrag.current(), []);

  const onMouseDown = (event: React.MouseEvent) => {
    // At 1× there is nothing to pan — let the event bubble to swipe navigation.
    if (transformRef.current.scale <= MIN_SCALE) return;
    event.preventDefault();
    event.stopPropagation();

    const origin = transformRef.current;
    const startX = event.clientX;
    const startY = event.clientY;

    const onMove = (move: MouseEvent) => {
      const bounds = rect();
      if (!bounds) return;
      setTransform(
        clampTransform(
          {
            scale: origin.scale,
            x: origin.x + (move.clientX - startX),
            y: origin.y + (move.clientY - startY),
          },
          bounds.width,
          bounds.height,
        ),
      );
    };
    const onUp = () => stopMouseDrag.current();
    stopMouseDrag.current = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      stopMouseDrag.current = () => {};
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const bounds = rect();
    if (!bounds) return;
    const focalX = event.clientX - bounds.left;
    const focalY = event.clientY - bounds.top;
    setTransform((prev) =>
      prev.scale > MIN_SCALE
        ? IDENTITY
        : zoomAt(
            IDENTITY,
            focalX,
            focalY,
            DOUBLE_CLICK_SCALE,
            bounds.width,
            bounds.height,
          ),
    );
  };

  // Touch state for single-finger pan and two-finger pinch. `touch-none` on the
  // container suppresses native scrolling/zooming so no preventDefault needed.
  const gesture = useRef<{
    mode: "pan" | "pinch";
    start: Transform;
    pointerX: number;
    pointerY: number;
    startDistance: number;
  } | null>(null);

  const onTouchStart = (event: React.TouchEvent) => {
    const bounds = rect();
    if (!bounds) return;

    if (event.touches.length >= 2) {
      event.stopPropagation();
      const [a, b] = [event.touches[0], event.touches[1]];
      gesture.current = {
        mode: "pinch",
        start: transformRef.current,
        pointerX: (a.clientX + b.clientX) / 2 - bounds.left,
        pointerY: (a.clientY + b.clientY) / 2 - bounds.top,
        startDistance: distance(a, b),
      };
      return;
    }

    // Single finger at 1× should swipe-navigate, not pan.
    if (transformRef.current.scale <= MIN_SCALE) {
      gesture.current = null;
      return;
    }
    event.stopPropagation();
    const touch = event.touches[0];
    gesture.current = {
      mode: "pan",
      start: transformRef.current,
      pointerX: touch.clientX,
      pointerY: touch.clientY,
      startDistance: 0,
    };
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const state = gesture.current;
    const bounds = rect();
    if (!state || !bounds) return;
    event.stopPropagation();

    if (state.mode === "pinch" && event.touches.length >= 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      const factor = distance(a, b) / (state.startDistance || 1);
      setTransform(
        zoomAt(
          state.start,
          state.pointerX,
          state.pointerY,
          factor,
          bounds.width,
          bounds.height,
        ),
      );
    } else if (state.mode === "pan") {
      const touch = event.touches[0];
      setTransform(
        clampTransform(
          {
            scale: state.start.scale,
            x: state.start.x + (touch.clientX - state.pointerX),
            y: state.start.y + (touch.clientY - state.pointerY),
          },
          bounds.width,
          bounds.height,
        ),
      );
    }
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (!gesture.current) return;
    event.stopPropagation();
    if (event.touches.length === 0) {
      gesture.current = null;
    } else if (
      event.touches.length === 1 &&
      transformRef.current.scale > MIN_SCALE
    ) {
      // Lifting one finger of a pinch resumes a single-finger pan.
      const touch = event.touches[0];
      gesture.current = {
        mode: "pan",
        start: transformRef.current,
        pointerX: touch.clientX,
        pointerY: touch.clientY,
        startDistance: 0,
      };
    }
  };

  return (
    <div
      ref={containerRef}
      className={twMerge(
        "relative w-full h-full overflow-hidden touch-none select-none",
        className,
      )}
      style={{ cursor: zoomed ? "grab" : undefined }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      />
    </div>
  );
};
