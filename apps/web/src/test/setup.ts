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
