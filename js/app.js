import { createRandom } from './random.js';
import { enroll, begin, act, finishTournament, nextEpilogue } from './game.js';
import { loadHistory, saveResult } from './state.js';
import { render } from './view.js';
const root = document.querySelector('#app');
const rng = createRandom();
let state = null, saveOk = true;
function draw() { root.innerHTML = render(state, loadHistory(), saveOk); }
root.addEventListener('click', event => {
  const target = event.target.closest('button[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'enroll') state = enroll(rng);
  if (action === 'begin') state = begin(state);
  if (action === 'act') state = act(state, target.dataset.key, rng);
  if (action === 'tournament') state = finishTournament(state);
  if (action === 'epilogue') { state = nextEpilogue(state); if (state.screen === 'graduation') saveOk = saveResult(state.summary); }
  if (action === 'home') state = null;
  draw();
  const focusTarget = root.querySelector('h1, h2');
  if (focusTarget) { focusTarget.tabIndex = -1; focusTarget.focus({ preventScroll: true }); }
});
draw();
