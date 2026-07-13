import { Fragment } from "react";
import { cn } from "@/lib/utils";

/* Conteúdo de aula pode trazer código: blocos ```...``` viram <pre> mono, `trecho` vira código inline.
   Sem markdown além disso — o resto é texto corrido com quebras preservadas. */

const PRE = "overflow-x-auto rounded-md border border-border bg-background p-2.5 font-mono text-xs leading-relaxed";
const INLINE = "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]";

function Inline({ text }: { text: string }) {
  const parts = text.split(/`([^`\n]+)`/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <code key={i} className={INLINE}>{p}</code> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/```(?:[\w-]*)\n?([\s\S]*?)```/g);
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <pre key={i} className={cn("my-1.5", PRE)}><code>{p.replace(/\n$/, "")}</code></pre>
        ) : p.trim() ? (
          <p key={i} className="whitespace-pre-wrap"><Inline text={p.replace(/^\n+|\n+$/g, "")} /></p>
        ) : null,
      )}
    </div>
  );
}
