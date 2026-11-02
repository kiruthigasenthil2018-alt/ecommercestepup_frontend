import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// dedupe keeps a single copy of React (two copies cause errors such as "destroy is not a function")
export default defineConfig({ plugins: [react()], resolve: { dedupe: ["react", "react-dom"] }, server: { port: 5173 } });
