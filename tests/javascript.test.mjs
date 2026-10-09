import test from 'node:test';
import assert from 'node:assert/strict';
import { bubbleSteps, binarySteps, parseArray } from '../desktop/algorithms.js';
import { learningSteps, learningDemos, parseLearningInput } from '../desktop/learning-demos.js';
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

test('全部教学演示：独立动画快照、计数、边界与输入检查', () => {
  for (const [source, demo] of Object.entries(learningDemos)) {
    for (const values of [demo.defaults, [3], [3,3], [2,4,1,3,5,2,6,4]]) {
      const before = [...values], steps = learningSteps(source, values);
      assert.deepEqual(values, before);
      assert.equal(steps[0].action, 'start');
      assert.equal(steps.at(-1).action, 'done');
      for (const step of steps) {
        assert.ok(step.highlighted.every(i => i >= 0 && i < values.length));
        assert.ok(step.codeLine >= 0 && step.codeLine < demo.code.length);
      }
      const last = steps.at(-1);
      if (source === 'linear_sum') {
        assert.equal(last.variables.sum, values.reduce((a,b) => a+b,0));
        assert.deepEqual(last.counters,[values.length,values.length]);
        assert.equal(steps[0].scene.sum,0);
      } else if (source === 'stack_intro') {
        assert.deepEqual(last.scene.output,[...values].reverse());
        assert.deepEqual(last.scene.stack,[]); assert.equal(last.variables.top,-1);
        assert.deepEqual(steps[0].scene.output,[]);
      } else if (source === 'loop_analysis') {
        assert.deepEqual(last.counters,[values.length,values.length ** 2]);
        assert.equal(steps[0].scene.nested,0);
      } else if (source === 'student_records') {
        const score = Math.max(...values);
        assert.deepEqual(last.scene.best,{id:values.indexOf(score)+1,score});
        assert.equal(steps[0].scene.best.id,1);
      } else if (source === 'array_access') {
        const changed = [...values]; changed[Math.floor(values.length/2)]++;
        assert.deepEqual(last.values,changed);
        assert.deepEqual(steps[0].values,values);
        assert.deepEqual(last.counters,[values.length+1,1]);
      } else if (source === 'singly_links') {
        assert.deepEqual(last.scene.order, values.map((_, i) => i + 1));
        assert.equal(last.scene.nodes.at(-1).removed, true);
        assert.equal(steps[0].scene.nodes.length, values.length);
        const linked = steps.find(step => step.codeLine === 3);
        assert.equal(linked.scene.order.length, values.length + 1);
      } else if (source === 'circular_links') {
        const ids = values.map((_, i) => i), output = []; let at = 0;
        while (ids.length) { at = (at + 1) % ids.length; output.push(values[ids.splice(at, 1)[0]]); }
        assert.deepEqual(last.scene.output, output);
        assert.equal(last.variables.remaining, 0);
        assert.equal(last.scene.head, null);
        assert.ok(last.scene.nodes.every(node => node.removed));
        for (const step of steps.filter(step => step.action !== 'count' || step.variables.count === 1)) {
          if (!step.scene.order.length) continue;
          const nodes = step.scene.nodes;
          assert.equal(nodes[step.scene.order.at(-1) - 1].next, step.scene.head);
          assert.equal(step.scene.order.length, step.variables.remaining);
        }
      } else if (source === 'doubly_links') {
        const ids = values.map((_, i) => i + 1); ids.splice(Math.floor(values.length / 2), 1);
        assert.deepEqual(last.scene.order, ids);
        ids.forEach((id, i) => {
          assert.equal(last.scene.nodes[id - 1].prev, ids[i - 1] ?? null);
          assert.equal(last.scene.nodes[id - 1].next, ids[i + 1] ?? null);
        });
      } else if (source === 'stack_operations') {
        const stack = [], output = [];
        values.forEach((value, i) => { stack.push(value); if (i % 2) output.push(stack.pop()); });
        while (stack.length) output.push(stack.pop());
        assert.deepEqual(last.scene.output, output);
        assert.equal(last.variables.top, -1);
        steps.forEach((step, i) => { if (step.action === 'peek') {
          assert.deepEqual(step.scene.stack, steps[i-1].scene.stack);
          assert.equal(step.variables.top, steps[i-1].variables.top);
        } });
      } else if (source === 'queue_operations') {
        assert.deepEqual(last.scene.output, values);
        assert.deepEqual(last.scene.queue, []);
        assert.equal(last.variables.front, values.length);
        assert.equal(last.variables.rear, values.length);
        steps.forEach(step => assert.deepEqual(step.scene.queue, step.scene.slots.slice(step.variables.front, step.variables.rear)));
      }
      // Mutating a late frame must never change an earlier frame used for rewind.
      const first = structuredClone(steps[0]);
      last.values[0] = 999;
      if (last.scene.nodes) last.scene.nodes[0].value = 999;
      assert.deepEqual(steps[0], first);
    }
    assert.throws(() => learningSteps(source,[]));
    assert.throws(() => parseLearningInput(source,'1 '.repeat(9)));
  }
  assert.throws(() => parseLearningInput('student_records','-1 80'));
  assert.throws(() => learningSteps('student_records',[101]));
});

test('JavaScript/Python 通信：课程、原有数据库、草稿、判题和关闭', { timeout: 35000 }, async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dsa-bridge-test-'));
  let backend;
  try {
    backend = new Backend(root, { dataDir });
    const boot = await backend.request('bootstrap');
    assert.equal(boot.lessons[0].title, '算法与复杂度');
    assert.equal(boot.lessons.length, 11);
    assert.deepEqual(boot.lessons[0].stages.map(stage => stage.id), ['animation', 'practice', 'exam']);
    const exam = await backend.request('load_stage', { lesson: 'sorting.bubble_sort', stage: 'exam', language: 'C' });
    assert.equal(exam.problem.source.id, 'P1177');
    assert.equal(exam.problem.caseCount, 3);
    const params = { lesson: 'sorting.bubble_sort', stage: 'practice', language: 'C' };
    const stage = await backend.request('load_stage', params);
    assert.equal(stage.problem.caseCount, 3);
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
    assert.equal(events.filter(item => item.event === 'case').length, 3);
    assert.ok(events.some(item => item.event === 'terminal' && item.payload.kind === 'command'));
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
