
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                login: resolve(__dirname, "index.html"),
                uploads: resolve(__dirname, "uploads.html")
            }
        }
    }
});
