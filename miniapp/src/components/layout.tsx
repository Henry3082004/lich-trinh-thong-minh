import React from "react";
import { Page, Spinner, useNavigate } from "zmp-ui";
import { CartButton } from "./cart-button";

export function Screen({
  title,
  back = true,
  children,
  bottom,
  cart = false,
}: {
  title?: string;
  back?: boolean;
  children: React.ReactNode;
  bottom?: React.ReactNode;
  // Hiện nút giỏ lịch trình nổi (các màn khám phá)
  cart?: boolean;
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
      {cart && <CartButton withBottom={!!bottom} />}
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
