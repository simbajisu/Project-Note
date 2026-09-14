import { readdir, readFile, access } from "node:fs/promises";
import assert from "node:assert/strict";
const root = new URL("../dist/", import.meta.url);
const files = await readdir(root, {recursive:true});
assert(files.includes("index.html"));
assert(!files.some(file => /(?:^|[/\\])(editor|write|local|server)(?:[./\\]|$)/i.test(file)), "Editor or server output leaked into Pages.");
const html = await readFile(new URL("index.html", root), "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert(match[1].startsWith("./"), "Pages assets must be relative: " + match[1]);
  await access(new URL(match[1], root));
}
for (const file of files) {
  const url = new URL(file.replaceAll("\\","/"), root);
  if (file.endsWith(".js")) {
    const js = await readFile(url,"utf8");
    assert(!js.includes("/api/notes") && !js.includes("Markdown 저장") && !js.includes("로컬 작성기"), "Editor API or UI leaked into Pages.");
  }
  if (file.endsWith(".css")) {
    const css = await readFile(url,"utf8");
    for (const match of css.matchAll(/url\(([^)]+)\)/g)) {
      const asset = match[1].replace(/^['"]|['"]$/g,"");
      if (asset.startsWith("data:") || asset.startsWith("#")) continue;
      assert(!asset.startsWith("/") && !asset.includes("://"), "Expected relative fonts.");
      await access(new URL(asset, url));
    }
  }
}
console.log("Pages output: reader only; all relative assets and fonts present.");
