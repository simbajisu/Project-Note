import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Markdown } from "@/components/markdown";
import { headings, noteDate, type Note } from "@/lib/notes";
import { notes } from "./notes";
import "katex/dist/katex.min.css";
import "./styles.css";

function Reader({note}: {note: Note}) {
  const toc = headings(note.content);
  return <div className="site-shell reader-shell">
    <SiteHeader/>
    <div className="reading-layout">
      <aside className="toc">
        <a className="back-link" href="./"><ArrowLeft size={15}/>노트 목록</a>
        {toc.length > 0 && <div className="toc-inner">
          <div className="toc-label">목차</div>
          <nav aria-label="노트 목차">{toc.map(item => <a key={item.id} className={item.level === 3 ? "subheading" : ""} href={"#" + item.id}>{item.text}</a>)}</nav>
        </div>}
      </aside>
      <main className="paper">
        <header className="document-header"><h1>{note.title}</h1>
          <div className="document-meta">{note.example && <span>예시 노트</span>}{note.updated_at && <time dateTime={note.updated_at}>수정일 {noteDate(note.updated_at)}</time>}</div>
        </header>
        {note.abstract && <section className="abstract" aria-label="요약"><h2>요약</h2><p>{note.abstract}</p></section>}
        <Markdown content={note.content}/>
      </main>
    </div>
  </div>;
}
function Library() {
  return <div className="site-shell"><SiteHeader/><main className="library">
    <h1 className="library-title">노트 목록</h1>
    <div className="list-label"><span>노트 <span className="count">{notes.filter(n => !n.example).length}</span></span><span>최근 수정순</span></div>
    {notes.map((note,i) => <a className="note-row" href={"./?note=" + encodeURIComponent(note.id)} key={note.id}>
      <span className="note-number">{String(i+1).padStart(2,"0")}</span>
      <div className="note-summary">
        {note.example && <div className="note-meta"><span className="example-label">예시</span></div>}
        <h2>{note.title}<ArrowUpRight/></h2>
        {note.abstract && <p>{note.abstract}</p>}
        {note.updated_at && <time className="note-date" dateTime={note.updated_at}>{noteDate(note.updated_at)}</time>}
      </div>
    </a>)}
    {notes.length === 0 && <p className="empty-notes">등록된 노트가 없습니다.</p>}
  </main></div>;
}
const requestedId = new URLSearchParams(location.search).get("note");
const note = notes.find(n => n.id === requestedId);
document.title = note ? note.title + " · 프로젝트 노트" : "프로젝트 노트";
createRoot(document.getElementById("root")!).render(
  requestedId === null ? <Library/> : note ? <Reader note={note}/> :
    <div className="site-shell"><SiteHeader/><main className="not-found"><h1>노트를 찾을 수 없습니다.</h1><p><a href="./">노트 목록으로</a></p></main></div>
);
