import React from "react";
import { Page, Spinner, useNavigate } from "zmp-ui";

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "calc(10px + env(safe-area-inset-top)) 12px 10px",
  background: "var(--green-700)",
  color: "#fff",
};

export function Screen({
  title,
  back = true,
  children,
  bottom,
}: {
  title?: string;
  back?: boolean;
  children: React.ReactNode;
  bottom?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <Page className="page">
      {title && (
        <div style={headerStyle}>
          {back && (
            <button
              aria-label="Quay lại"
              onClick={() => navigate(-1)}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 22, padding: 4, cursor: "pointer" }}
            >
              ←
            </button>
          )}
          <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
        </div>
      )}
      {children}
      {bottom && <div className="bottom-bar">{bottom}</div>}
    </Page>
  );
}

export function Loading() {
  return (
    <div className="empty">
      <Spinner />
    </div>
  );
}
