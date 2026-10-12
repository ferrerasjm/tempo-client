import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

export function IconTooltips() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const dismissed = useRef<HTMLElement | null>(null);
  const text =
    target?.dataset.tooltip || target?.getAttribute("aria-label") || "";

  useEffect(() => {
    setTarget(null);
    dismissed.current = null;
  }, [location.key]);

  useEffect(() => {
    const pixels = new WeakMap<
      HTMLImageElement,
      { source: string; data: ImageData }
    >();
    function overDrink(element: HTMLElement, event: PointerEvent) {
      if (!element.classList.contains("session-drink")) return true;
      const image = element.querySelector("img");
      if (!image?.complete || !image.naturalWidth) return false;
      const bounds = image.getBoundingClientRect();
      const scale = Math.min(
        bounds.width / image.naturalWidth,
        bounds.height / image.naturalHeight,
      );
      const x = Math.floor(
        (event.clientX -
          bounds.left -
          (bounds.width - image.naturalWidth * scale) / 2) /
          scale,
      );
      const y = Math.floor(
        (event.clientY -
          bounds.top -
          (bounds.height - image.naturalHeight * scale) / 2) /
          scale,
      );
      if (x < 0 || y < 0 || x >= image.naturalWidth || y >= image.naturalHeight)
        return false;
      const cached = pixels.get(image);
      let data = cached?.source === image.currentSrc ? cached.data : undefined;
      if (!data) {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return true;
        context.drawImage(image, 0, 0);
        data = context.getImageData(0, 0, canvas.width, canvas.height);
        pixels.set(image, { source: image.currentSrc, data });
      }
      const horizontalInset = Math.ceil(4 / scale);
      const solid = (column: number) =>
        column >= 0 &&
        column < data.width &&
        data.data[(y * data.width + column) * 4 + 3] > 32;
      return (
        solid(x) && solid(x - horizontalInset) && solid(x + horizontalInset)
      );
    }
    const find = (element: EventTarget | null) =>
      element instanceof Element
        ? element.closest<HTMLElement>(
            ".task-icon-action, .timer-control, .icon-button, [data-tooltip], [data-cursor-tooltip]",
          )
        : null;
    function show(event: Event) {
      let element = find(event.target);
      if (
        element &&
        event instanceof PointerEvent &&
        !overDrink(element, event)
      )
        element = null;
      if (
        event.type === "focusin" &&
        element?.hasAttribute("data-cursor-tooltip") &&
        !element.matches(":focus-visible")
      )
        return;
      if (!element) {
        setTarget(null);
        return;
      }
      if (element !== dismissed.current) {
        setPointer(
          event instanceof PointerEvent &&
            element.hasAttribute("data-tooltip") &&
            !element.hasAttribute("data-tooltip-anchor")
            ? { x: event.clientX, y: event.clientY }
            : null,
        );
        setTarget(element);
      }
    }
    function move(event: PointerEvent) {
      const element = find(event.target);
      if (
        element?.hasAttribute("data-tooltip") &&
        element !== dismissed.current
      ) {
        setTarget(overDrink(element, event) ? element : null);
        setPointer(
          element.hasAttribute("data-tooltip-anchor")
            ? null
            : { x: event.clientX, y: event.clientY },
        );
      } else {
        setTarget((current) =>
          current?.hasAttribute("data-tooltip") ? null : current,
        );
      }
    }
    function hide(event: Event) {
      const element = find(event.target);
      const related = (event as MouseEvent | FocusEvent).relatedTarget;
      if (element && related instanceof Node && element.contains(related))
        return;
      if (element === dismissed.current) dismissed.current = null;
      setTarget((current) => (current === element ? null : current));
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTarget((current) => {
          dismissed.current = current;
          return null;
        });
      }
    }
    const clear = () => setTarget(null);
    document.addEventListener("pointerover", show);
    document.addEventListener("pointermove", move);
    document.addEventListener("focusin", show);
    document.addEventListener("pointerout", hide);
    document.addEventListener("focusout", hide);
    document.addEventListener("keydown", escape);
    document.addEventListener("click", clear);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    return () => {
      document.removeEventListener("pointerover", show);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("focusin", show);
      document.removeEventListener("pointerout", hide);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("click", clear);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, []);

  useLayoutEffect(() => {
    if (!target || !tooltip.current) return;
    const anchor = target.getBoundingClientRect();
    const bounds = tooltip.current.getBoundingClientRect();
    if (pointer && target.hasAttribute("data-tooltip")) {
      setPosition({
        left: Math.max(
          8,
          Math.min(pointer.x - bounds.width / 2, innerWidth - bounds.width - 8),
        ),
        top:
          pointer.y >= bounds.height + 18
            ? pointer.y - bounds.height - 14
            : Math.min(pointer.y + 18, innerHeight - bounds.height - 8),
      });
      return;
    }
    setPosition({
      left: Math.max(
        8,
        Math.min(
          anchor.x + anchor.width / 2 - bounds.width / 2,
          innerWidth - bounds.width - 8,
        ),
      ),
      top:
        anchor.top >= bounds.height + 16
          ? anchor.top - bounds.height - 8
          : Math.min(anchor.bottom + 8, innerHeight - bounds.height - 8),
    });
  }, [target, text, pointer]);

  return target && text
    ? createPortal(
        <div
          ref={tooltip}
          role="tooltip"
          className={`icon-tooltip${target.hasAttribute("data-cursor-tooltip") ? " table-art-tooltip" : ""}`}
          style={position}
        >
          {text}
        </div>,
        target.closest("dialog") || document.body,
      )
    : null;
}
