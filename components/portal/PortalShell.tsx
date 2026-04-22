import PortalSidebar from "./PortalSidebar";

export default function PortalShell({
  companyName,
  companySlug,
  userEmail,
  children,
}: {
  companyName: string;
  companySlug: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="portal-layout">
      <PortalSidebar
        companyName={companyName}
        companySlug={companySlug}
        userEmail={userEmail}
      />
      <main className="portal-main">{children}</main>
      <style>{`
        .portal-layout {
          display: flex;
          min-height: 100vh;
          position: relative;
          z-index: 2;
        }
        .portal-main {
          flex: 1;
          padding: 40px 48px;
          max-width: calc(100vw - 240px);
          overflow-x: auto;
        }
        @media (max-width: 860px) {
          .portal-layout { flex-direction: column; }
          .portal-main { padding: 24px 16px; max-width: 100vw; }
        }
      `}</style>
    </div>
  );
}
