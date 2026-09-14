"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
export function Markdown({content}:{content:string}){
 return <div className="prose-note"><ReactMarkdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[[rehypeKatex,{strict:false,trust:false,throwOnError:false,maxExpand:500,maxSize:20}]]} skipHtml components={{
 h2:({node,children,...props})=><h2 id={"section-"+node?.position?.start.line} {...props}>{children}</h2>,
 h3:({node,children,...props})=><h3 id={"section-"+node?.position?.start.line} {...props}>{children}</h3>,
 a:({node,...props})=><a {...props} target={props.href?.startsWith("#")?undefined:"_blank"} rel="noopener noreferrer"/>,
 table:({node,...props})=><div className="table-wrap"><table {...props}/></div>
 }}>{content}</ReactMarkdown></div>;
}
