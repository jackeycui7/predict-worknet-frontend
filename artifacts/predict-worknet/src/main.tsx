import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Connect to real backend
setBaseUrl("https://predict-server-production-fe90.up.railway.app");

createRoot(document.getElementById("root")!).render(<App />);
