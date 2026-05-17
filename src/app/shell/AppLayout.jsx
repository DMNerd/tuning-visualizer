export default function AppLayout({
  header,
  stage,
  controls,
  modals,
  toaster,
}) {
  return (
    <div className="tv-shell">
      <header className="tv-shell__header">{header}</header>
      <main className="tv-shell__main">{stage}</main>
      <footer className="tv-shell__controls">{controls}</footer>
      {modals}
      {toaster}
    </div>
  );
}
