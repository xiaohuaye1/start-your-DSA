import test from 'node:test';
import assert from 'node:assert/strict';
import { bubbleSteps, binarySteps, parseArray } from '../desktop/algorithms.js';
import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { Backend } = require('../desktop/backend.cjs');
const root = fileURLToPath(new URL('..', import.meta.url));

test('JavaScript 冒泡步骤：排序结果、相邻交换、快照和稳定性', () => {
  const inputs = [[], [1], [1,1], [5,2,8,1,6,3,7,4], [2,-3,2,0,-3,8,0], [1,2,3], [3,2,1]];
  for (let i = 0; i < 40; i++) inputs.push(Array.from({ length: i % 16 + 1 }, (_, j) => ((i * 13 + j * 7) % 19) - 9));
  for (const values of inputs) {
    const original = [...values];
    const steps = bubbleSteps(values);
    assert.deepEqual(values, original);
    assert.deepEqual(steps.at(-1).values, [...values].sort((a,b) => a-b));
    steps.forEach((step, index) => {
      assert.deepEqual([...step.values].sort((a,b) => a-b), [...original].sort((a,b) => a-b));
      if (step.action === 'swap') {
        const previous = [...steps[index-1].values], [left,right] = step.highlighted;
        assert.equal(right, left+1); assert.ok(previous[left] > previous[right]);
        [previous[left], previous[right]] = [previous[right], previous[left]];
        assert.deepEqual(step.values, previous);
      }
    });
  }
});

test('数组输入检查', () => {
  assert.deepEqual(parseArray('5， 2 -3 2'), [5,2,-3,2]);
  for (const value of ['', '1.2 3', '1e3', '100000', '1 '.repeat(17)]) assert.throws(() => parseArray(value));
});

test('二分查找：找到和未找到', () => {
  assert.match(binarySteps([1,2,6,8], 6).at(-1).explanation, /下标为 2/);
  assert.match(binarySteps([1,2,6,8], 5).at(-1).explanation, /不存在/);
  assert.throws(() => binarySteps([2,1], 1));
});

test('JavaScript/Python 通信：课程、原有数据库、草稿、判题和关闭', { timeout: 35000 }, async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dsa-bridge-test-'));
  let backend;
  try {
    backend = new Backend(root, { dataDir });
    const boot = await backend.request('bootstrap');
    assert.equal(boot.lessons[0].title, '冒泡排序');
    const params = { lesson: 'sorting.bubble_sort', stage: 'practice', language: 'C' };
    const stage = await backend.request('load_stage', params);
    assert.equal(stage.problem.caseCount, 5);
    await backend.request('save_note', { lesson: params.lesson, text: '跨界面保存的笔记' });
    await backend.request('save_draft', { ...params, code: stage.reference });
    assert.equal((await backend.request('load_stage', params)).draft, stage.reference);
    await assert.rejects(backend.request('complete', params));
    const events = [];
    const result = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('判题超时')), 20000);
      backend.on('event', message => {
        events.push(message);
        if (message.event === 'finished') { clearTimeout(timer); resolve(message.payload); }
      });
    });
    await backend.request('judge', { ...params, code: stage.reference, mode: 'submit' });
    const finished = await result;
    assert.equal(finished.verdict, 'AC', finished.message);
    assert.equal(events.filter(item => item.event === 'case').length, 5);
    assert.ok(finished.completed.some(([lesson,stage]) => lesson === params.lesson && stage === params.stage));
    await backend.stop();
    backend = new Backend(root, { dataDir });
    const restored = await backend.request('load_stage', params);
    assert.equal(restored.note, '跨界面保存的笔记');
    assert.equal(restored.draft, stage.reference);
    assert.equal(restored.history[0][0], 'AC');
    await assert.rejects(backend.request('save_draft', { ...params, language: 'JAVA', code: '' }));
  } finally {
    if (backend) await backend.stop();
    await rm(dataDir, { recursive: true, force: true });
  }
});
