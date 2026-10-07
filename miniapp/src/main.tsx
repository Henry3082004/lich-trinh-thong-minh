import React from "react";
import { createRoot } from "react-dom/client";
import "zmp-ui/zaui.css";
import "./theme.css";
import MyApp from "./app";

createRoot(document.getElementById("app")!).render(<MyApp />);
