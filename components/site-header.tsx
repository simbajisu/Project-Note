import { FileText } from "lucide-react";
export function SiteHeader({ children, local = false }: {children?: React.ReactNode; local?: boolean}) {
  return <header className="site-header">
    {local ? <span className="brand"><FileText size={20} strokeWidth={1.5}/>노트 작성</span> : <a className="brand" href="./"><FileText size={20} strokeWidth={1.5}/>프로젝트 노트</a>}
    {children && <div className="header-actions">{children}</div>}
  </header>;
}
