import React from "react";

export default function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className="panel-sec">
      <button className="sec-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{title}</span><span className="chev">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="sec-body">{children}</div>}
    </section>
  );
}
