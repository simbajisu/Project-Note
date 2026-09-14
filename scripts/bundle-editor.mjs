import { readFile, mkdir, writeFile } from "node:fs/promises";
const directory = new URL("../.editor-build/", import.meta.url);
let html = await readFile(new URL("editor.html", directory), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error("Expected one self-contained editor script.");
for (const match of scripts) {
  const js = await readFile(new URL(match[1], directory), "utf8");
  html = html.replace(match[0], () => '<script type="module">' + js.replace(/<\/script/gi, "<\\/script") + "</script>");
}
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
  const css = await readFile(new URL(match[1], directory), "utf8");
  html = html.replace(match[0], () => "<style>" + css + "</style>");
}
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, "");
const shell = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style>[\s\S]*?<\/style>/gi, "");
if (/<(?:script|link)\b[^>]*(?:src|href)="(?!data:|#)/i.test(shell)) throw new Error("External editor asset remains.");
if (/url\((?!['"]?data:|['"]?#)/i.test([...html.matchAll(/<style>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n"))) throw new Error("External editor font remains.");
await mkdir(new URL("../local/", import.meta.url), {recursive:true});
await writeFile(new URL("../local/작성기.html", import.meta.url), html);
console.log("local/작성기.html — offline editor (" + Math.round(Buffer.byteLength(html)/1024) + " KB)");
