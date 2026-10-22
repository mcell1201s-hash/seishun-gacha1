import { createRandom } from "./random.js";
import { enroll, begin, act, finishTournament, yearFor } from "./game.js";
import { loadHistory, saveResult } from "./state.js";
import { render } from "./view.js";
import {
  actionFeedback,
  promotionFeedback,
  renderFeedback,
} from "./turn-feedback.js";
import { createTurnFlow } from "./turn-flow.js";
const root = document.querySelector("#app");
const rng = createRandom();
let state = null,
  saveOk = true;
function draw(displayed = state, feedback = null) {
  const previousScreen = document.body.dataset.screen;
  document.body.dataset.screen = displayed?.screen || "title";
  document.body.classList.toggle("showing-feedback", !!feedback);
  root.innerHTML = render(displayed, loadHistory(), saveOk);
  if (feedback) {
    root.querySelectorAll(":scope > *").forEach((el) => {
      el.inert = true;
    });
    root.insertAdjacentHTML("beforeend", renderFeedback(feedback));
    root.querySelector(".turn-feedback").focus({ preventScroll: true });
  } else {
    if (previousScreen !== document.body.dataset.screen)
      window.scrollTo({ top: 0, behavior: "instant" });
    const focusTarget = root.querySelector(
      displayed?.screen === "training" ? ".command-panel h2" : "h1, h2",
    );
    if (focusTarget) {
      focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
  }
}
const flow = createTurnFlow(draw);
root.addEventListener("click", (event) => {
  if (flow.busy) {
    event.preventDefault();
    flow.tap();
    return;
  }
  const target = event.target.closest("button[data-action]");
  if (!target || target.disabled || flow.locked) return;
  const action = target.dataset.action;
  if (action === "info") {
    root.querySelector("#training-info").showModal();
    return;
  }
  if (action === "close-info") {
    root.querySelector("#training-info").close();
    return;
  }
  if (action === "act") {
    const before = state,
      after = act(before, target.dataset.key, rng);
    if (before === after) return;
    const details = actionFeedback(before, after, target.dataset.key);
    if (flow.start(before, after, details)) state = after;
    return;
  }
  if (action === "tournament") {
    const before = state,
      after = finishTournament(state);
    state = after;
    if (state.screen === "graduation") saveOk = saveResult(state.summary);
    if (yearFor(after.turn) > yearFor(before.turn)) {
      flow.start(before, after, promotionFeedback(before, after), true);
      return;
    }
  }
  if (action === "enroll") state = enroll(rng);
  if (action === "begin") state = begin(state);
  if (action === "home") state = null;
  draw();
  window.scrollTo({ top: 0, behavior: "instant" });
});
root.addEventListener("keydown", (event) => {
  if (!flow.busy) return;
  if (event.repeat) {
    event.preventDefault();
    return;
  }
  if (["Enter", " ", "Escape"].includes(event.key)) {
    event.preventDefault();
    flow.tap();
  }
  if (event.key === "Tab") {
    event.preventDefault();
    root.querySelector(".feedback-next")?.focus();
  }
});
// Reload starts at the title as before; BFCache restores a committed state, never a stale timer.
window.addEventListener("pagehide", () => flow.suspend());
window.addEventListener("pageshow", () => flow.resume());
draw();
