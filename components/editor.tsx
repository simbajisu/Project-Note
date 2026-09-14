import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Check, Code2, Download, Eye, FilePlus2, Heading2, Sigma, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { SiteHeader } from "@/components/site-header";
import { Markdown } from "@/components/markdown";
import { downloadNote } from "@/components/note-actions";
import { template, parseNote, validateNote, type Note } from "@/lib/notes";

function newNote(): Note {
  const now = new Date().toISOString();
  const suffix = typeof crypto.randomUUID === "function" ? crypto.randomUUID().slice(0,8) : Math.random().toString(36).slice(2,10);
  const id = "note-" + now.slice(0,10).replaceAll("-","") + "-" + suffix;
  return {id, filename:id+".md", title:"", abstract:"", content:template, created_at:now, updated_at:now, example:false};
}
function snapshot(note: Note) {
  return JSON.stringify([note.filename, note.title, note.abstract, note.content]);
}
const draftKey = "paper-notes:offline-draft:v1:" + location.pathname;
export function Editor() {
  const [note, setNote] = useState<Note>(newNote);
  const [baseline, setBaseline] = useState("");
  const [exported, setExported] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [recovery, setRecovery] = useState<Note | null>(null);
  const [replacement, setReplacement] = useState<Note | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef(note);
  currentRef.current = note;
  const preview = useDeferredValue(note.content);
  const changed = snapshot(note) !== baseline;
  const pendingExport = changed && snapshot(note) !== exported;

  useEffect(() => {
    setBaseline(snapshot(currentRef.current));
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) { const saved: unknown = JSON.parse(raw); validateNote(saved); setRecovery(saved); }
    } catch { setDraftMessage("임시 보관을 사용할 수 없습니다. Markdown 파일로 저장해주세요."); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || recovery) return;
    const timer = setTimeout(() => {
      try {
        if (changed) {
          localStorage.setItem(draftKey, JSON.stringify(note));
          setDraftMessage("이 브라우저에 임시 보관됨");
        } else {
          localStorage.removeItem(draftKey);
          setDraftMessage("");
        }
      } catch { setDraftMessage("임시 보관 불가 · Markdown 파일로 저장해주세요."); }
    }, 400);
    return () => clearTimeout(timer);
  }, [note, changed, ready, recovery]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (changed && !recovery) {
        try { localStorage.setItem(draftKey, JSON.stringify(currentRef.current)); } catch { /* The export warning remains active. */ }
      }
      if (pendingExport) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [changed, pendingExport, recovery]);

  function update(key: "title" | "abstract" | "content", value: string) {
    setNote(n => ({...n, [key]:value}));
    setStatus(""); setError("");
  }
  function save() {
    if (recovery) return;
    try {
      if (!note.title.trim()) { document.getElementById("note-title")?.focus(); throw new Error("제목을 입력해주세요."); }
      const saved = {...note, title:note.title.trim(), updated_at:new Date().toISOString(), example:false};
      downloadNote(saved);
      setNote(saved);
      setExported(snapshot(saved));
      setStatus("다운로드 요청됨");
      setError("");
      try { localStorage.setItem(draftKey, JSON.stringify(saved)); } catch { /* Download works without browser storage. */ }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "파일을 저장하지 못했습니다."); }
  }
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function replaceWith(next: Note) {
    setNote(next); setRecovery(null); setReplacement(null); setExported(""); setStatus(""); setError("");
    setBaseline(snapshot(newNote()));
    try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* The autosave status will explain a storage failure. */ }
  }
  function requestReplacement(next: Note) {
    if (pendingExport || recovery) setReplacement(next);
    else replaceWith(next);
  }
  async function importMarkdown(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 800000) { setError("800KB 이하의 Markdown 파일을 선택해주세요."); return; }
    try { requestReplacement(parseNote(await file.text(), file.name)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "파일을 읽지 못했습니다."); }
  }
  function insert(text: string) {
    const field = textRef.current;
    if (!field) return;
    const start = field.selectionStart, end = field.selectionEnd;
    const next = note.content.slice(0,start)+text+note.content.slice(end);
    if (next.length > 200000) { setError("본문은 200,000자 이내로 작성해주세요."); return; }
    update("content", next);
    requestAnimationFrame(() => {field.focus(); field.setSelectionRange(start+text.length,start+text.length);});
  }
  return <div className="editor-page">
    <SiteHeader local>
      <span className="save-status" aria-live="polite">{status ? <><Check size={14}/>{status}</> : pendingExport ? "파일로 저장하지 않은 변경" : ""}</span>
      <Button variant="outline" onClick={() => requestReplacement(newNote())}><FilePlus2/>새 노트</Button>
      <Button onClick={save} disabled={!!recovery}><Download/>Markdown 저장</Button>
    </SiteHeader>
    <main className="editor-main">
      <div className="editor-breadcrumb"><span>로컬 작성기</span><span>/</span><span>Markdown + LaTeX</span></div>
      <div className="publish-help">
        <div><p>저장한 .md 파일을 저장소의 notes 폴더에 올리면 홈페이지에 반영됩니다.</p><span className="filename">파일 이름: <code>{note.filename}</code></span></div>
        <Button variant="outline" onClick={() => uploadRef.current?.click()}><Upload/>.md 열기</Button>
        <input ref={uploadRef} hidden type="file" accept=".md,.markdown" onChange={importMarkdown}/>
      </div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {recovery && <div className="notice"><span>임시 보관된 노트가 있습니다: {recovery.title || "제목 없음"}</span><div>
        <Button variant="ghost" onClick={() => replaceWith(recovery)}>복원</Button>
        <Button variant="ghost" onClick={() => {try {localStorage.removeItem(draftKey);} catch {} setRecovery(null);}}>버리기</Button>
      </div></div>}
      <div className="editor-title-group">
        <label className="sr-only" htmlFor="note-title">노트 제목</label>
        <Input id="note-title" className="title-input" value={note.title} disabled={!!recovery} onChange={e => update("title",e.target.value)} placeholder="노트 제목" maxLength={180}/>
        <label className="sr-only" htmlFor="note-abstract">노트 요약</label>
        <Textarea id="note-abstract" className="abstract-input" value={note.abstract} disabled={!!recovery} onChange={e => update("abstract",e.target.value)} placeholder="요약 (선택)" maxLength={1000}/>
      </div>
      <div className="writing-workspace">
        <section className="source-panel" aria-label="Markdown 작성">
          <div className="panel-header"><span><Code2 size={16}/>작성</span><span className="panel-language">MARKDOWN + LATEX</span></div>
          <div className="editor-toolbar">
            <Button variant="ghost" size="sm" aria-label="소제목 삽입" disabled={!!recovery} onClick={() => insert("\n## 소제목\n\n")}><Heading2/></Button>
            <Button variant="ghost" size="sm" disabled={!!recovery} onClick={() => insert("\n$$\n\\frac{a}{b} = c\n$$\n")}><Sigma/>수식</Button>
            <Button variant="ghost" size="sm" disabled={!!recovery} onClick={() => insert("\n$$\n\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}\n$$\n")}>행렬</Button>
          </div>
          <Textarea ref={textRef} id="note-body" aria-label="노트 본문 Markdown LaTeX" className="markdown-input" spellCheck={false} value={note.content} maxLength={200000} disabled={!!recovery} onChange={e => update("content",e.target.value)}/>
          <div className="editor-status"><span aria-live="polite">{draftMessage || "Ctrl / ⌘ + S로 Markdown 저장"}</span><span>{note.content.length.toLocaleString("ko-KR")}자</span></div>
        </section>
        <section className="preview-panel" aria-label="실시간 미리보기">
          <div className="panel-header"><span><Eye size={16}/>미리보기</span><span className="live-preview">실시간 반영</span></div>
          <div className="preview-paper"><h1>{note.title || "제목 없는 노트"}</h1>
            {note.abstract && <div className="abstract"><h2>요약</h2><p>{note.abstract}</p></div>}
            <Markdown content={preview}/>
          </div>
        </section>
      </div>
      <details className="syntax-help"><summary>Markdown · LaTeX 작성 도움말</summary>
        <div className="syntax-grid">
          <div><strong>기본 문법</strong><code>## 소제목</code><code>**강조할 내용**</code><code>[링크 제목](https://...)</code><code>- 목록 항목</code></div>
          <div><strong>수식 문법</strong><code>{"문장 속 수식: $E = mc^2$"}</code><code>{"독립 수식: $$ ... $$"}</code><code>{"분수: \\frac{a}{b}"}</code><code>{"합: \\sum_{i=1}^{n} x_i"}</code></div>
          <div><strong>여러 줄 수식</strong><pre>{"$$\n\\begin{aligned}\na &= b + c \\\\\nd &= e + f\n\\end{aligned}\n$$"}</pre></div>
        </div>
        <p>수식은 KaTeX가 지원하는 LaTeX 문법으로 표시됩니다. 전체 LaTeX 문서 명령은 지원하지 않습니다.</p>
        <p>임시 보관은 이 브라우저에서만 유지됩니다. 작성이 끝나면 Markdown 파일을 저장해주세요.</p>
        <p>기존 노트를 수정할 때는 .md 열기로 파일을 불러온 뒤 같은 파일 이름으로 저장소에 올리세요. 브라우저가 붙인 (1) 같은 이름은 원래 이름으로 되돌려주세요.</p>
      </details>
    </main>
    <AlertDialog open={!!replacement} onOpenChange={open => {if (!open) setReplacement(null);}}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>작성 중인 내용을 바꿀까요?</AlertDialogTitle><AlertDialogDescription>파일로 저장하지 않은 내용이 있습니다. 필요한 내용은 먼저 Markdown 파일로 저장해주세요.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>계속 작성</AlertDialogCancel><AlertDialogAction onClick={() => {if (replacement) replaceWith(replacement);}}>내용 바꾸기</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
