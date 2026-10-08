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
            <button className="header-back" aria-label="Quay lại" onClick={() => navigate(-1)}>
              ‹
            </button>
          )}
          <div className="header-title">{title}</div>
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
