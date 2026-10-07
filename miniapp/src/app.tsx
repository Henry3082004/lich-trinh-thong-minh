import React from "react";
import { AnimationRoutes, App, Route, SnackbarProvider, ZMPRouter } from "zmp-ui";
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
    <App theme="light">
      <SnackbarProvider>
        <DraftProvider>
          <ZMPRouter>
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
  );
}
