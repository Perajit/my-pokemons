import "@testing-library/jest-dom/vitest";

// jsdom lacks several DOM APIs that Base UI's interaction primitives (Menu,
// Popover, etc.) rely on for pointer handling and positioning. Polyfill them
// so click-to-open flows can be exercised in component tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}

// Disable CSS animations/transitions globally so component tests never wait on
// them (and so Base UI's computed-style transition tracking treats elements as
// settled immediately). jsdom doesn't execute CSS animations anyway, so this is
// mainly defensive + future-proofing for a real-DOM test env. NOTE: this does
// NOT affect setTimeout-driven (JS) animations — those zero their durations in
// the relevant tests.
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `*, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }`;
  document.head.appendChild(style);
}
