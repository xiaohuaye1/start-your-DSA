/* Drive the actual single-step / operation buttons, without removed toolbar controls. */
const assert = require('node:assert/strict');

async function seekStep(page, target) {
  await page.evaluate(target => {
    const canvas = document.getElementById('array-canvas');
    const wanted = Math.max(0, Math.min(target, Number(canvas.dataset.totalSteps) - 1));
    for (let attempt = 0; attempt < 1000; attempt++) {
      const current = Number(canvas.dataset.step);
      if (current === wanted) return;
      const rows = [...document.querySelectorAll('.operation-row')];
      const candidates = rows.filter(row => current < wanted
        ? Number(row.dataset.step) > current && Number(row.dataset.step) <= wanted
        : Number(row.dataset.step) < current && Number(row.dataset.step) >= wanted);
      const row = candidates.sort((a, b) => current < wanted
        ? Number(b.dataset.step) - Number(a.dataset.step) : Number(a.dataset.step) - Number(b.dataset.step))[0];
      if (!row) throw new Error('No operation button reaches the requested step');
      row.click();
    }
    throw new Error('Animation did not reach requested step');
  }, target);
}

async function finishAnimation(page) {
  const count = await page.locator('#array-canvas').getAttribute('data-total-steps');
  await seekStep(page, Number(count) - 1);
  assert.equal(await page.locator('#next').isDisabled(), true);
}

async function seekPhase(page, phase) {
  await seekStep(page, 0);
  await page.evaluate(phase => {
    const canvas = document.getElementById('array-canvas');
    for (let count = 0; count < 1000; count++) {
      if (canvas.dataset.phase === phase) return;
      const next = document.getElementById('next');
      if (next.disabled) throw new Error('Missing animation phase: ' + phase);
      next.click();
    }
    throw new Error('Animation phase loop exceeded');
  }, phase);
}

module.exports = { seekStep, finishAnimation, seekPhase };
