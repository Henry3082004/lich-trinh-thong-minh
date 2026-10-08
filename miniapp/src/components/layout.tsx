import React from "react";
import { Page, Spinner, useNavigate } from "zmp-ui";

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
        <div className="app-header">
          <div className="app-header-inner">
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
