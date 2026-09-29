import "@testing-library/jest-dom";

// jsdom has no ResizeObserver; Radix primitives (Checkbox, Select, …) measure with it.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
