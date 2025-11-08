import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const SCROLL_LISTENER_OPTIONS = { passive: true, capture: true };

export default function FloatingListbox({
  anchorRef,
  isOpen,
  children,
  className,
  offset = 4,
  style: styleProp,
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
    }
  }, [isOpen]);

  if (typeof document === "undefined") {
    return null;
  }

  if (!mounted || !isOpen || !position) {
    return null;
  }

  const classes = className
    ? `tv-floating-listbox ${className}`
    : "tv-floating-listbox";

  return createPortal(
    <div
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
