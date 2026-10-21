import { TIMING } from "./turn-feedback.js";

// Presentation owns timers only. The caller evaluates and commits the game action exactly once.
export function createTurnFlow(
  renderFrame,
  clock = {
    now: () => Date.now(),
    setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
    clearTimeout: (id) => globalThis.clearTimeout(id),
  },
) {
  let busy = false,
    timer = null,
    ticket = 0,
    until = 0,
    transition = null,
    phase = null;
  const clear = () => {
    if (timer !== null) clock.clearTimeout(timer);
    timer = null;
  };
  function finish() {
    if (!busy) return;
    const after = transition.after;
    clear();
    ticket++;
    busy = false;
    transition = null;
    phase = null;
    until = clock.now() + TIMING.cooldown;
    renderFrame(after, null);
  }
  function showResult() {
    if (!busy || phase === "result") return;
    clear();
    phase = "result";
    renderFrame(transition.before, { ...transition.details, phase });
    if (!transition.details.important) {
      const token = ticket;
      timer = clock.setTimeout(() => {
        if (busy && token === ticket) finish();
      }, TIMING.result);
    }
  }
  return {
    get busy() {
      return busy;
    },
    get locked() {
      return busy || clock.now() < until;
    },
    start(before, after, details, resultOnly = false) {
      if (this.locked) return false;
      busy = true;
      phase = "action";
      ticket++;
      transition = { before, after, details };
      if (resultOnly) showResult();
      else {
        renderFrame(before, { ...details, phase });
        const token = ticket;
        timer = clock.setTimeout(() => {
          if (busy && token === ticket) showResult();
        }, TIMING.action);
      }
      return true;
    },
    tap() {
      if (phase === "action") showResult();
      else if (phase === "result") finish();
    },
    suspend() {
      clear();
      ticket++;
    },
    resume() {
      if (!busy || timer !== null) return;
      const token = ticket;
      if (phase === "action")
        timer = clock.setTimeout(() => {
          if (busy && token === ticket) showResult();
        }, TIMING.action);
      else if (!transition.details.important)
        timer = clock.setTimeout(() => {
          if (busy && token === ticket) finish();
        }, TIMING.result);
    },
    finish,
  };
}
