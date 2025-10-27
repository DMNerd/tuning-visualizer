import { useCallback, useEffect, memo } from "react";
import clsx from "clsx";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useToggle, useUpdateEffect } from "react-use";

function Section({
  title,
  children,
  size = "md",
  defaultOpen = true,
  collapsible = true,
  actions = null,
  className,
  onToggle,
  id,
}) {
  const [open, setOpen] = useToggle(defaultOpen);
  const bodyId = id ? `${id}-body` : undefined;
  const headerId = id ? `${id}-header` : undefined;

  const toggle = useCallback(() => {
    if (!collapsible) return;
    setOpen();
  }, [collapsible, setOpen]);

  useUpdateEffect(() => onToggle?.(open), [open, onToggle]);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen, setOpen]);

  const headerContent = (
    <>
      <span className="tv-panel__title">{title}</span>
      <div className="tv-panel__actions">
        {actions}
        {collapsible && (
          <span className="tv-panel__icon" aria-hidden>
            {open ? <FiChevronDown /> : <FiChevronRight />}
          </span>
        )}
      </div>
    </>
  );

  return (
    <section
      className={clsx(
        "tv-panel",
        `tv-panel--size-${size}`,
        { "is-collapsed": collapsible && !open },
        className,
      )}
      aria-labelledby={headerId}
    >
      {collapsible ? (
        <button
          id={headerId}
          className="tv-panel__header"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          type="button"
        >
          {headerContent}
        </button>
      ) : (
        <div id={headerId} className="tv-panel__header" aria-controls={bodyId}>
          {headerContent}
        </div>
      )}

      <div
        id={bodyId}
        className="tv-panel__body"
        role="region"
        aria-hidden={collapsible ? (!open).toString() : "false"}
      >
        <div className="tv-panel__body-inner">{children}</div>
      </div>
    </section>
  );
}

export default memo(Section);
