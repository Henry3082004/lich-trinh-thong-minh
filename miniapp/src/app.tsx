import React, { useEffect } from "react";
import { AnimationRoutes, App, Route, SnackbarProvider, useNavigate, ZMPRouter } from "zmp-ui";
import { ErrorBoundary } from "./components/error-boundary";
import { CartProvider } from "./state/cart";
import { DraftProvider } from "./state/draft";
import { TripProvider } from "./state/trip";
import HomePage from "./pages/home";
import CreatePage from "./pages/create";
import EditorPage from "./pages/editor";
import CartPage from "./pages/cart";
import TripPage from "./pages/trip";
import PlanPage from "./pages/plan";
import ChatPage from "./pages/chat";
import PlacesPage from "./pages/places";
import PlaceDetailPage from "./pages/place-detail";
import PosterPage from "./pages/poster";
import MyItinerariesPage from "./pages/my-itineraries";

// Đường dẫn cũ /export (trang xuất ảnh) giờ là /poster
function LegacyExport() {
  const navigate = useNavigate();
  useEffect(() => navigate("/poster", { replace: true }), []);
  return null;
}

export default function MyApp() {
  return (
    <ErrorBoundary>
    <App theme="light">
      <SnackbarProvider>
        <CartProvider>
        <TripProvider>
        <DraftProvider>
          {/* Bản web demo không có window.APP_ID nên ZMPRouter (production) sẽ đặt basename
              "/zapps/undefined" và không route nào khớp. Dùng MemoryRouter cho bản web. */}
          <ZMPRouter memoryRouter={__WEB_DEMO__}>
            <AnimationRoutes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/places" element={<PlacesPage />} />
              <Route path="/place/:id" element={<PlaceDetailPage />} />
              <Route path="/poster" element={<PosterPage />} />
              <Route path="/export" element={<LegacyExport />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/trip" element={<TripPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/my" element={<MyItinerariesPage />} />
            </AnimationRoutes>
          </ZMPRouter>
        </DraftProvider>
        </TripProvider>
        </CartProvider>
      </SnackbarProvider>
    </App>
    </ErrorBoundary>
  );
}
