import React from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

export default function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className="panel-sec">
      <button
        className="sec-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="chev" aria-hidden>
          {open ? <FiChevronDown /> : <FiChevronRight />}
        </span>
      </button>
      {open && <div className="sec-body">{children}</div>}
    </section>
  );
}
