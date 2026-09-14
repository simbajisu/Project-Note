import { createRoot } from "react-dom/client";
import { Editor } from "@/components/editor";
import "katex/dist/katex.min.css";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<Editor/>);
