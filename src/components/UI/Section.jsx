import React from "react";
import clsx from "clsx";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

export default function Section({
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
  const [open, setOpen] = React.useState(defaultOpen);
  const bodyId = id ? `${id}-body` : undefined;
  const headerId = id ? `${id}-header` : undefined;

  const toggle = () => {
    if (!collapsible) return;
    setOpen((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  };

  const headerContent = (
    <>
      <span className="sec-title">{title}</span>
      <div className="sec-actions">
        {actions}
        {collapsible && (
          <span className="chev" aria-hidden>
            {open ? <FiChevronDown /> : <FiChevronRight />}
          </span>
        )}
      </div>
    </>
  );

  return (
    <section
      className={clsx("panel-sec", className)}
      data-size={size}
      data-collapsed={open ? "false" : "true"}
      aria-labelledby={headerId}
    >
      {collapsible ? (
        <button
          id={headerId}
          className="sec-header"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          type="button"
        >
          {headerContent}
        </button>
      ) : (
        <div id={headerId} className="sec-header" aria-controls={bodyId}>
          {headerContent}
        </div>
      )}

      {/* Keep body in the DOM for smooth size control & internal scrolling via CSS */}
      <div
        id={bodyId}
        className="sec-body"
        role="region"
        aria-hidden={collapsible ? (!open).toString() : "false"}
      >
        <div className="sec-body-inner">{children}</div>
      </div>
    </section>
  );
}
