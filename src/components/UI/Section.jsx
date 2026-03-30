import { memo } from "react";
import clsx from "clsx";

function Section({
  title,
  children,
  size = "md",
  actions = null,
  className,
  id,
}) {
  const bodyId = id ? `${id}-body` : undefined;
  const headerId = id ? `${id}-header` : undefined;

  const headerContent = (
    <>
      <span className="tv-panel__title">{title}</span>
      <div className="tv-panel__actions">{actions}</div>
    </>
  );

  return (
    <section
      className={clsx("tv-panel", `tv-panel--size-${size}`, className)}
      aria-labelledby={headerId}
    >
      <div id={headerId} className="tv-panel__header" aria-controls={bodyId}>
        {headerContent}
      </div>

      <div
        id={bodyId}
        className="tv-panel__body"
        role="region"
        aria-hidden="false"
      >
        <div className="tv-panel__body-inner">{children}</div>
      </div>
    </section>
  );
}

export default memo(Section);
