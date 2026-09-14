import { parseDocument } from "yaml";

export type Note = {
  id: string; filename: string; title: string; abstract: string; content: string;
  created_at: string; updated_at: string; example: boolean;
};
export const template = "## 1. 개요\n\n\n## 2. 방법\n\n\n## 3. 결과\n\n\n## 4. 결론\n\n\n## 참고 자료\n\n";

export function validFilename(value: string): string {
  if (!/\.(md|markdown)$/i.test(value) || /[<>:"/\\|?*\x00-\x1f]/.test(value) || value.startsWith(".") || value.length > 160)
    throw new Error("파일 이름은 경로가 없는 160자 이내의 .md 또는 .markdown 이름이어야 합니다.");
  return value;
}

function stringField(value: unknown, fallback: string, max: number, name: string) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string" || value.length > max) throw new Error(name + " 형식을 확인해주세요.");
  return value;
}

function dateField(value: unknown, fallback = "") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new Error("날짜는 YYYY-MM-DD 또는 ISO 날짜로 입력해주세요.");
  return new Date(value).toISOString();
}

export function validateNote(value: unknown): asserts value is Note {
  if (!value || typeof value !== "object") throw new Error("노트 형식을 확인해주세요.");
  const note = value as Note;
  if (typeof note.filename !== "string") throw new Error("파일 이름을 확인해주세요.");
  validFilename(note.filename);
  for (const [key, max] of [["title", 180], ["abstract", 1000], ["content", 200000]] as const) {
    if (typeof note[key] !== "string" || note[key].length > max) throw new Error(key + "의 길이 또는 형식을 확인해주세요.");
  }
  if (note.id !== note.filename.replace(/\.(md|markdown)$/i, "") || typeof note.example !== "boolean") throw new Error("노트 식별자를 확인해주세요.");
  if (typeof note.created_at !== "string" || typeof note.updated_at !== "string") throw new Error("날짜 형식을 확인해주세요.");
  dateField(note.created_at); dateField(note.updated_at);
}

export function parseNote(source: string, filename: string): Note {
  validFilename(filename);
  if (source.length > 220000) throw new Error("파일은 220,000자 이내여야 합니다.");
  let content = source.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
  let meta: Record<string, unknown> = {};
  if (content.startsWith("---\n")) {
    const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!match) throw new Error("파일 상단 메타데이터를 ---로 닫아주세요.");
    const doc = parseDocument(match[1], { schema: "core", uniqueKeys: true });
    if (doc.errors.length) throw new Error("메타데이터: " + doc.errors[0].message);
    const parsed: unknown = doc.toJS({ maxAliasCount: 10 });
    if (parsed !== null && (typeof parsed !== "object" || Array.isArray(parsed))) throw new Error("메타데이터 형식을 확인해주세요.");
    meta = (parsed ?? {}) as Record<string, unknown>;
    content = content.slice(match[0].length).replace(/^\n/, "");
  }
  const id = filename.replace(/\.(md|markdown)$/i, "");
  const title = stringField(meta.title, id, 180, "제목").trim();
  if (!title) throw new Error("제목을 입력해주세요.");
  const created = dateField(meta.created ?? meta.created_at);
  const note: Note = {
    id, filename, title,
    abstract: stringField(meta.abstract, "", 1000, "요약"),
    content,
    created_at: created,
    updated_at: dateField(meta.updated ?? meta.updated_at, created),
    example: meta.example === true,
  };
  validateNote(note);
  return note;
}

export function toMarkdown(note: Note) {
  validateNote(note);
  if (!note.title.trim()) throw new Error("제목을 입력해주세요.");
  return [
    "---",
    "title: " + JSON.stringify(note.title.trim()),
    "abstract: " + JSON.stringify(note.abstract),
    "created: " + JSON.stringify(note.created_at),
    "updated: " + JSON.stringify(note.updated_at),
    ...(note.example ? ["example: true"] : []),
    "---", "", note.content,
  ].join("\n");
}

export function noteDate(value: string) {
  return value ? new Intl.DateTimeFormat("ko-KR", {year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Asia/Seoul"}).format(new Date(value)) : "날짜 미지정";
}

export function sortNotes(notes: Note[]) {
  return [...notes].sort((a,b) => Number(a.example)-Number(b.example) || (Date.parse(b.updated_at)||0)-(Date.parse(a.updated_at)||0) || a.id.localeCompare(b.id, "ko"));
}

export function headings(source: string) {
  const result: {id:string;text:string;level:number}[]=[]; let fence="";
  source.split("\n").forEach((line,index)=>{
    const f=line.match(/^\s{0,3}(\x60{3,}|~{3,})/);
    if(f){if(!fence)fence=f[1];else if(f[1][0]===fence[0]&&f[1].length>=fence.length)fence="";return;}
    if(fence)return; const m=line.match(/^(#{2,3})\s+(.+)$/);
    if(m)result.push({id:"section-"+(index+1),text:m[2].replace(/[*_\x60]/g,"").replace(/\s+#+\s*$/,""),level:m[1].length});
  });
  return result;
}
