import { toMarkdown, type Note } from "@/lib/notes";
export function downloadNote(note: Note) {
  const url = URL.createObjectURL(new Blob([toMarkdown(note)], {type: "text/markdown;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = note.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
