import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Patch fetch to use ngrok base URL
const API_BASE = "https://delegate-whooping-chewer.ngrok-free.dev";
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === "string" && input.startsWith("/")) {
    input = API_BASE + input;
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);