import { useEffect, useState } from "react";

/** text を msPerChar 間隔で1文字ずつ出現させる。msPerChar <= 0 なら即座に全文表示する。 */
export function useTypewriter(text: string, msPerChar: number): string {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    if (msPerChar <= 0 || text.length === 0) {
      setRevealedCount(text.length);
      return;
    }

    const id = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, msPerChar);

    return () => clearInterval(id);
  }, [text, msPerChar]);

  return text.slice(0, revealedCount);
}
