import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const SCROLL_LISTENER_OPTIONS = { passive: true, capture: true };

export default function FloatingListbox({
  anchorRef,
  isOpen,
  children,
  className,
  offset = 4,
  style: styleProp,
  onMeasure,
}) {
  // gv renders only in the browser, where the portal target exists
  const mounted = typeof document !== "undefined";
  const [position, setPosition] = useState(null);
  const wrapperRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (typeof window === "undefined") {
      setPosition(null);
      return;
    }
    const anchor = anchorRef?.current;
    if (!anchor) {
      setPosition(null);
      return;
    }

    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + offset + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [anchorRef, offset]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    // oxlint-disable-next-line react/set-state-in-effect -- measures the anchor after layout, before paint
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePositionChange = () => {
      updatePosition();
    };

    window.addEventListener("resize", handlePositionChange);
    window.addEventListener(
      "scroll",
      handlePositionChange,
      SCROLL_LISTENER_OPTIONS,
    );

    return () => {
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener(
        "scroll",
        handlePositionChange,
        SCROLL_LISTENER_OPTIONS,
      );
    };
  }, [isOpen, updatePosition]);

  // a closed listbox renders nothing; its position is measured again on open
  useEffect(() => {
    if (!isOpen && typeof onMeasure === "function") {
      onMeasure({ width: 0, height: 0 });
    }
  }, [isOpen, onMeasure]);

  useLayoutEffect(() => {
    if (!isOpen || typeof onMeasure !== "function") return undefined;
    const node = wrapperRef.current;
    if (!node) return undefined;

    const reportMeasure = () => {
      onMeasure({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    reportMeasure();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      reportMeasure();
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [isOpen, onMeasure]);

  if (typeof document === "undefined") {
    return null;
  }

  if (!mounted || !isOpen || !position) {
    return null;
  }

  const classes = [
    "tv-floating-listbox",
    className,
    isOpen ? "is-interactive" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      ref={wrapperRef}
      className={classes}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        ...styleProp,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
