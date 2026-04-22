export default function HudBottom() {
  return (
    <footer className="hud-bot">
      <div>
        <span>&copy; 2026 ekkoee</span>
        <span className="hud-sep">//</span>
        <span className="desk-only">
          built for factories that don&apos;t need another dashboard
        </span>
      </div>
      <div>
        <span className="desk-only">MODE: </span>
        <span className="hud-acc">DEMO</span>
        <span className="hud-sep">//</span>
        <span className="desk-only">ZONE: </span>
        <span className="hud-grn">GREEN</span>
      </div>
    </footer>
  );
}
