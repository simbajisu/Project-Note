import { readdir, readFile } from "node:fs/promises";
import { parseNote } from "../lib/notes.ts";
const files = (await readdir(new URL("../notes/", import.meta.url))).filter(name => /\.(md|markdown)$/i.test(name));
const ids = new Set();
for (const filename of files) {
  try {
    const note = parseNote(await readFile(new URL("../notes/" + encodeURIComponent(filename), import.meta.url), "utf8"), filename);
    if (ids.has(note.id)) throw new Error("중복된 파일 이름입니다.");
    ids.add(note.id);
  } catch (error) { throw new Error(filename + ": " + error.message); }
}
console.log(files.length + "개 Markdown 노트 확인 완료");
