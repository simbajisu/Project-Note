import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseNote, toMarkdown, validFilename, headings, sortNotes, validateNote } from "../lib/notes.ts";

test("Korean metadata and LaTeX survive repeated export/import", () => {
  const original = parseNote('---\ntitle: "따옴표 \\" 및 : 콜론"\nabstract: "첫째\\n둘째"\ncreated: "2026-09-14"\nupdated: "2026-09-15"\n---\n\n## 방법\n\n$$\n\\begin{aligned}\nx &= \\frac{1}{2} \\\\\ny &= x^2\n\\end{aligned}\n$$\n', "내 노트.md");
  let next = original;
  for (let i=0; i<3; i++) next = parseNote(toMarkdown(next), next.filename);
  assert.deepEqual(next, original);
});
test("Plain Markdown, CRLF and BOM imports work", () => {
  const note = parseNote("\uFEFF## 개요\r\n\r\n$x^2$\r\n", "plain.md");
  assert.equal(note.title, "plain");
  assert.equal(note.content, "## 개요\n\n$x^2$\n");
  assert.equal(note.updated_at, "");
});
test("YAML multiline abstracts and legacy exports are accepted", () => {
  const note = parseNote("---\ntitle: 제목\nabstract: |\n  첫 줄\n  다음 줄\n---\n\n## 내용", "legacy.md");
  assert.equal(note.abstract, "첫 줄\n다음 줄\n");
  assert.equal(note.content, "## 내용");
});
test("Changing a title preserves the filename and note URL", () => {
  const note = parseNote("본문", "original.markdown");
  note.title = "수정한 제목";
  const imported = parseNote(toMarkdown(note), note.filename);
  assert.equal(imported.id, "original");
  assert.equal(imported.filename, "original.markdown");
});
test("Invalid metadata fails before deployment", () => {
  for (const source of [
    "---\ntitle: [wrong]\n---\nbody",
    "---\ntitle: okay\ntitle: duplicate\n---\nbody",
    "---\ntitle: unfinished",
    "---\ntitle: ''\n---\nbody",
    "---\nupdated: not-a-date\n---\nbody",
    "---\n- wrong\n---\nbody",
  ]) assert.throws(() => parseNote(source, "bad.md"));
  assert.throws(() => parseNote("x".repeat(200001), "long.md"));
});
test("Imported filenames cannot escape the notes folder", () => {
  for (const filename of ["../note.md", "C:\\note.md", ".hidden.md", "x/y.md", "note.txt", "x?.md"]) assert.throws(() => validFilename(filename));
  assert.equal(validFilename("연구 노트.md"), "연구 노트.md");
  assert.throws(() => validateNote({filename: "okay.md", title:""}));
});
test("TOC ignores code fences and matches Markdown line positions", () => {
  assert.deepEqual(headings("## 시작\n\n~~~md\n## 코드 속 제목\n~~~\n### 세부 내용\n"), [
    {id:"section-1", text:"시작", level:2},
    {id:"section-6", text:"세부 내용", level:3},
  ]);
});
test("Notes sort by update date; examples stay last", () => {
  const old = parseNote('---\nupdated: "2026-09-01"\n---\n\nold', "old.md");
  const recent = parseNote('---\nupdated: "2026-09-14"\n---\n\nnew', "new.md");
  const example = {...recent, id:"example", filename:"example.md", example:true};
  assert.deepEqual(sortNotes([example,old,recent]).map(n=>n.id), ["new","old","example"]);
});
test("The example round-trips without lost equation backslashes", async () => {
  const source = await readFile(new URL("../notes/example.md", import.meta.url), "utf8").catch(() => null);
  if (source === null) return;
  const note = parseNote(source, "example.md");
  assert.match(note.content, /\\frac/);
  assert.match(note.content, /\\begin\{aligned\}/);
  assert.deepEqual(parseNote(toMarkdown(note), note.filename), note);
});
