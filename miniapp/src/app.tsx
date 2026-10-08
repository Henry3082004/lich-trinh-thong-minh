import React from "react";
import { AnimationRoutes, App, Route, SnackbarProvider, ZMPRouter } from "zmp-ui";
import { ErrorBoundary } from "./components/error-boundary";
import { DraftProvider } from "./state/draft";
import HomePage from "./pages/home";
import CreatePage from "./pages/create";
import EditorPage from "./pages/editor";
import PlacesPage from "./pages/places";
import PlaceDetailPage from "./pages/place-detail";
import ExportPage from "./pages/export";
import MyItinerariesPage from "./pages/my-itineraries";

export default function MyApp() {
  return (
    <ErrorBoundary>
    <App theme="light">
      <SnackbarProvider>
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
              <Route path="/export" element={<ExportPage />} />
              <Route path="/my" element={<MyItinerariesPage />} />
            </AnimationRoutes>
          </ZMPRouter>
        </DraftProvider>
      </SnackbarProvider>
    </App>
    </ErrorBoundary>
  );
}
