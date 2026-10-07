import cors from "cors";
import express from "express";
import { config } from "./config";
import { errorHandler } from "./lib/http";
import { itinerariesRouter } from "./routes/itineraries";
import { placesRouter } from "./routes/places";
import { suggestRouter } from "./routes/suggest";

export function createApp() {
  const app = express();

  const origins = config.corsOrigin.split(",").map((o) => o.trim());
  app.use(cors({ origin: origins.includes("*") ? true : origins }));
  app.use(express.json({ limit: "200kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", placesRouter);
  app.use("/api", suggestRouter);
  app.use("/api", itinerariesRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Không tìm thấy" });
  });
  app.use(errorHandler);

  return app;
}
