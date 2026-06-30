import { Sparkles } from "lucide-react";

export function TypingIndicator({ label = "AI is thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-4 animate-pulse" />
      </div>
      <span>{label}</span>
      <span className="flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </span>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-primary"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/** Reveals text word-by-word for AI responses. */
import { useEffect, useState } from "react";
export function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    const words = text.split(/(\s+)/);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(words.slice(0, i).join(""));
      if (i >= words.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <>{shown}</>;
}
