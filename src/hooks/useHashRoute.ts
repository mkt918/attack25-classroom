import { useEffect, useState } from "react";

/**
 * "#/room/ABC1" のようなハッシュを軽量にパースするだけのルーター。
 * GitHub Pages では History API ベースのルーティングが 404 になるため、
 * ハッシュルーティングを一貫して使う(招待URLの形式に関わるため後から変更しない)。
 */
export function useHashRoute(): string[] {
  const [segments, setSegments] = useState(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setSegments(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return segments;
}

function parseHash(): string[] {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash.split("/").filter(Boolean);
}

export function navigate(path: string): void {
  window.location.hash = path.startsWith("/") ? path : `/${path}`;
}
