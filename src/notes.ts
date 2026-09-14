import { parseNote, sortNotes } from "@/lib/notes";
const files = import.meta.glob<string>("../notes/*", { query: "?raw", import: "default", eager: true });
export const notes = sortNotes(Object.entries(files).filter(([filename]) => /\.(md|markdown)$/i.test(filename)).map(([filename, source]) => parseNote(source, filename.split("/").pop()!)));
