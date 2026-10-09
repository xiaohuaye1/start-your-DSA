import test from 'node:test';
import assert from 'node:assert/strict';
import { sidebarBounds, defaultSidebarWidth, normalizeSidebarWidth } from '../desktop/sidebar-resizer.js';

test('sidebar bounds preserve workspace and clamp to the supported range', () => {
  assert.deepEqual(sidebarBounds(1480), { min: 180, max: 420 });
  assert.deepEqual(sidebarBounds(1060, 49), { min: 180, max: 243 });
  assert.deepEqual(sidebarBounds(900), { min: 180, max: 180 });
});
test('default width follows the compact layout without accepting invalid preferences', () => {
  assert.equal(defaultSidebarWidth(1480), 222);
  assert.equal(defaultSidebarWidth(1300), 210);
  assert.equal(defaultSidebarWidth(1060), 195);
  for (const width of [undefined, null, -1, 0, 179, 421, 222.5, '222', NaN, Infinity])
    assert.equal(normalizeSidebarWidth(width), 0);
  for (const width of [180, 222, 420]) assert.equal(normalizeSidebarWidth(width), width);
});
