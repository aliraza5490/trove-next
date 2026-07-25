import { useCallback, useRef } from "react";

export function useAutoResizeTextarea<T extends HTMLTextAreaElement>() {
  const ref = useRef<T>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, []);
  return { ref, resize } as const;
}

export default useAutoResizeTextarea;
