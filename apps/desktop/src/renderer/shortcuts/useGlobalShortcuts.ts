import { onCleanup, onMount } from "solid-js";

function isBrowserZoomShortcut(evt: KeyboardEvent): boolean {
  const primaryModifier = evt.ctrlKey || evt.metaKey;
  if (!primaryModifier || evt.altKey) return false;
  return (
    evt.key === "=" ||
    evt.key === "+" ||
    evt.key === "-" ||
    evt.key === "_" ||
    evt.key === "0" ||
    evt.code === "Equal" ||
    evt.code === "Minus" ||
    evt.code === "Digit0" ||
    evt.code === "NumpadAdd" ||
    evt.code === "NumpadSubtract" ||
    evt.code === "Numpad0"
  );
}

export function useGlobalShortcuts(): void {
  onMount(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (isBrowserZoomShortcut(evt)) evt.preventDefault();
    };
    const onWheel = (evt: WheelEvent) => {
      if (evt.ctrlKey || evt.metaKey) evt.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("wheel", onWheel, {
      capture: true,
      passive: false,
    });
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("wheel", onWheel, true);
    });
  });
}
