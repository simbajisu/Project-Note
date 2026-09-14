import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const editor = mode === "editor";
  return {
    base: "./",
    plugins: [react()],
    resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
    publicDir: editor ? false : "public",
    build: {
      outDir: editor ? ".editor-build" : "dist",
      assetsInlineLimit: editor ? 2000000 : 4096,
      cssCodeSplit: !editor,
      rolldownOptions: {
        input: fileURLToPath(new URL(editor ? "./editor.html" : "./index.html", import.meta.url)),
        output: editor ? { codeSplitting: false } : undefined,
      },
    },
  };
});
