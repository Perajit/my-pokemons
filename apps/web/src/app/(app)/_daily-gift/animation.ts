// Daily-gift reveal choreography durations (ms). The reveal is driven by
// setTimeout, not CSS, so disabling CSS in tests can't speed it up — tests zero
// these instead (see modal.test.tsx / button.test.tsx) to keep real timers and
// userEvent while the UI settles in ~0ms. Mutable object so a test can override
// a single duration (e.g. to hold the "shaking" window open) and restore it.
export const giftAnimation = {
  shakeMs: 900,
  openMs: 500,
};
