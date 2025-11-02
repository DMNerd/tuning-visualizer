import { useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKey, useLatest, useLockBodyScroll } from "react-use";
import clsx from "clsx";

const DEFAULT_CARD_CLASS = "tv-modal__card";

function normalizeShortcuts(closeHotkeys) {
  if (!Array.isArray(closeHotkeys)) return [];
  return closeHotkeys
    .map((shortcut) => {
      if (!shortcut) return null;
      if (typeof shortcut === "function") {
        return { predicate: shortcut };
      }
      if (typeof shortcut.predicate === "function") {
        return { preventDefault: true, ...shortcut };
      }
      return null;
    })
    .filter(Boolean);
}

function resolvePortalTarget(portalTarget) {
  if (portalTarget) return portalTarget;
  if (typeof document !== "undefined") return document.body;
  return null;
}

function ModalFrame({
  isOpen,
  onClose,
  ariaLabel,
  ariaLabelledby,
  closeHotkeys = [],
  cardClassName,
  cardProps = {},
  children,
  portalTarget,
}) {
  const onCloseRef = useLatest(onClose);
  const cardRef = useRef(null);

  const shortcuts = useMemo(() => normalizeShortcuts(closeHotkeys), [closeHotkeys]);

  const close = useCallback(
    (event) => {
      if (!isOpen) return;
      onCloseRef.current?.(event);
    },
    [isOpen, onCloseRef],
  );

  useLockBodyScroll(isOpen);

  useKey(
    "Escape",
    (event) => {
      if (!isOpen) return;
      event.preventDefault();
      close(event);
    },
    { event: "keydown" },
    [isOpen, close],
  );

  useKey(
    (event) => {
      if (!isOpen || shortcuts.length === 0) return false;
      return shortcuts.some((shortcut) => shortcut.predicate(event));
    },
    (event) => {
      if (!isOpen) return;
      const match = shortcuts.find((shortcut) => shortcut.predicate(event));
      if (!match) return;
      if (match.preventDefault !== false) event.preventDefault();
      if (typeof match.onMatch === "function") {
        match.onMatch(event, close);
      } else {
        close(event);
      }
    },
    { event: "keydown" },
    [isOpen, shortcuts, close],
  );

  useClickAway(
    cardRef,
    (event) => {
      if (!isOpen) return;
      close(event);
    },
    ["mousedown", "touchstart"],
  );

  const target = resolvePortalTarget(portalTarget);
  if (!isOpen || !target) return null;

  const mergedClassName = clsx(DEFAULT_CARD_CLASS, cardClassName);
  const content = typeof children === "function" ? children({ close, cardRef }) : children;

  return createPortal(
    <div className="tv-modal" role="presentation">
      <div className="tv-modal__backdrop" aria-hidden onClick={close} />
      <div
        ref={cardRef}
        className={mergedClassName}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        {...cardProps}
      >
        {content}
      </div>
    </div>,
    target,
  );
}

export default ModalFrame;
