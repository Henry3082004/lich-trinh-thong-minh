import cors from "cors";
import express from "express";
import { config } from "./config";
import { errorHandler } from "./lib/http";
import { cartRouter } from "./routes/cart";
import { chatRouter } from "./routes/chat";
import { imagesRouter } from "./routes/images";
import { itinerariesRouter } from "./routes/itineraries";
import { placesRouter } from "./routes/places";
import { planRouter } from "./routes/plan";
import { postersRouter } from "./routes/posters";
import { suggestRouter } from "./routes/suggest";

export function createApp() {
  const app = express();
  // Chạy sau proxy của Railway: lấy đúng IP và giao thức (https) của người gọi
  app.set("trust proxy", 1);

  const origins = config.corsOrigin.split(",").map((o) => o.trim());
  app.use(cors({ origin: origins.includes("*") ? true : origins }));
  app.use(express.json({ limit: "200kb" }));

  // Log ngắn mỗi request để xem trên Railway có request tới không (bỏ qua health check)
  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    app.use((req, res, next) => {
      if (req.path === "/health") return next();
      const started = Date.now();
      res.on("finish", () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`));
      next();
    });
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", placesRouter);
  app.use("/api", suggestRouter);
  app.use("/api", itinerariesRouter);
  app.use("/api", imagesRouter);
  app.use("/api", postersRouter);
  app.use("/api", chatRouter);
  app.use("/api", cartRouter);
  app.use("/api", planRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Không tìm thấy" });
  });
  app.use(errorHandler);

  return app;
}
