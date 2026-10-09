import { bubbleSteps, binarySteps, parseArray } from './algorithms.js';
import { learningDemos, learningSteps, parseLearningInput, lessonDemo } from './learning-demos.js';

const $ = id => document.getElementById(id);
const api = window.dsa;
let bootstrap, current, language = 'C', editor, loading = false, busy = false, closing = false;
let steps = [], stepIndex = 0, playTimer = null, cellOrder = [], cellAnimations = [];
let draftTimer, noteTimer, toastTimer, noteDirty = false, draftDirty = false;
let completed = new Set();
let terminalSize = 0, terminalTruncated = false;
const actionNames = { start: '准备开始', compare: '比较相邻元素', swap: '交换元素', keep: '保持顺序',
  settle: '完成这一轮', done: '演示完成', narrow: '缩小查找区间' };
const learningActionNames = { read: '读取元素', accumulate: '更新总和', push: '入栈', pop: '出栈',
  execute: '循环执行', inspect: '比较记录', update: '更新数据', access: '下标访问' };
const courseOutline = [
  { title: '入门篇', lessons: ['算法与复杂度', '数据结构简介', '算法分析', '结构体回顾与学习'] },
  { title: '线性结构', lessons: ['数组', '链表', '循环链表', '双向链表', '栈', '队列', '循环队列'] },
  { title: '查找与排序', lessons: ['排序算法概述', '冒泡排序', '选择排序', '插入排序', '快速排序', '归并排序', '堆排序', '二分查找'] },
  { title: '树与图', lessons: ['二叉树', '平衡二叉树', '堆', '图的基础', '图的遍历'] },
  { title: '高级专题', lessons: ['哈希表', '贪心算法', '动态规划'], collapsed: true },
  { title: '综合练习', lessons: ['数据结构综合训练'], collapsed: true },
];
const courseGroupState = new Map();

function textElement(tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`); svg.append(use); return svg;
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  $('status-message').textContent = message;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}

function guard(callback) {
  return (...args) => Promise.resolve().then(() => callback(...args)).catch(error => toast(error.message));
}

function markdown(target, source) {
  target.innerHTML = window.DOMPurify.sanitize(window.marked.parse(source), {
    FORBID_TAGS: ['img', 'iframe', 'form', 'input', 'button', 'style'], FORBID_ATTR: ['style'],
  });
}

function makeEditor() {
  window.ace.config.set('basePath', '../node_modules/ace-builds/src-min-noconflict');
  editor = window.ace.edit('code-editor');
  editor.setTheme('ace/theme/tomorrow_night');
  editor.session.setMode('ace/mode/c_cpp');
  editor.session.setUseWorker(false);
  editor.session.setTabSize(4);
  editor.setOptions({ fontSize: 13, fontFamily: "Consolas, 'Cascadia Code', monospace", showPrintMargin: false,
    highlightActiveLine: true, showFoldWidgets: true, useSoftTabs: true, scrollPastEnd: .2, enableBasicAutocompletion: false });
  editor.renderer.setPadding(16);
  editor.renderer.setScrollMargin(12, 12);
  editor.session.on('change', () => {
    if (loading || !current?.problem) return;
    draftDirty = true;
    $('draft-state').textContent = '正在保存…';
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => saveDraft().catch(error => toast(error.message)), 500);
  });
  editor.commands.addCommand({ name: 'saveDSA', bindKey: { win: 'Ctrl-S', mac: 'Command-S' }, exec: guard(saveAll) });
  editor.commands.addCommand({ name: 'runDSA', bindKey: { win: 'F5', mac: 'F5' }, exec: guard(() => runJudge('sample')) });
  editor.commands.addCommand({ name: 'submitDSA', bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' }, exec: guard(() => runJudge('submit')) });
  new ResizeObserver(() => editor.resize()).observe($('code-editor'));
}

async function saveDraft() {
  clearTimeout(draftTimer);
  if (!current?.problem || !draftDirty) return;
  const request = { lesson: current.lesson, stage: current.stage.id, language, code: editor.getValue() };
  draftDirty = false;
  try { await api.saveDraft(request); $('draft-state').textContent = '已保存'; }
  catch (error) { draftDirty = true; $('draft-state').textContent = '保存失败'; throw error; }
}

async function saveNotes() {
  clearTimeout(noteTimer);
  if (!current || !noteDirty) return;
  const request = { lesson: current.lesson, text: $('notes').value };
  noteDirty = false;
  try { await api.saveNote(request); $('note-state').textContent = '已自动保存'; }
  catch (error) { noteDirty = true; $('note-state').textContent = '保存失败'; throw error; }
}

async function saveAll() { await Promise.all([saveDraft(), saveNotes()]); toast('代码草稿和笔记已保存'); }

function buildCourses(query = '') {
  const tree = $('course-tree'); tree.replaceChildren();
  const outlineTitles = new Set(courseOutline.flatMap(group => group.lessons));
  const extra = bootstrap.lessons.filter(lesson => !outlineTitles.has(lesson.title));
  const groups = extra.length ? [...courseOutline, { title: '其他课程', lessons: extra.map(lesson => lesson.title) }] : courseOutline;
  let number = 0;
  for (const chapter of groups) {
    const items = chapter.lessons.map(title => ({ title, number: ++number, lesson: bootstrap.lessons.find(lesson => lesson.title === title) }));
    const visible = items.filter(item => `${chapter.title} ${item.title} ${item.lesson?.stages.map(stage => stage.title).join(' ') || ''}`.includes(query));
    if (!visible.length) continue;
    const group = document.createElement('details'); group.className = 'course-group';
    group.open = query ? true : (courseGroupState.get(chapter.title) ?? !chapter.collapsed);
    const summary = textElement('summary', chapter.title); summary.prepend(icon('chevron'));
    if (!items.some(item => item.lesson)) summary.append(textElement('span', '待开放', 'course-availability'));
    group.append(summary);
    group.addEventListener('toggle', () => { if (!query && group.isConnected) courseGroupState.set(chapter.title, group.open); });
    for (const { title, number, lesson } of visible) {
      const button = textElement('button', '', 'lesson-link');
      button.append(textElement('span', `${number}.`, 'lesson-number'), textElement('span', title));
      button.disabled = !lesson || busy;
      button.title = lesson ? `打开${title}` : `${title} · 课程待开放`;
      if (lesson) {
        button.dataset.lesson = lesson.id;
        const active = current?.lesson === lesson.id;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'page');
        if (lesson.stages.every(stage => completed.has(`${lesson.id}/${stage.id}`))) button.append(textElement('span', '✓', 'completed-mark'));
        button.addEventListener('click', guard(() => loadStage(lesson.id, active ? current.stage.id : lesson.stages[0].id)));
      }
      group.append(button);
    }
    tree.append(group);
  }
  if (!tree.childElementCount) tree.append(textElement('p', '没有匹配的课程', 'empty-courses'));
  buildStageTabs();
}

function buildStageTabs() {
  const focusedStage = document.activeElement?.dataset.stage;
  const lesson = bootstrap.lessons.find(item => item.id === current?.lesson) || bootstrap.lessons[0];
  $('stage-tabs').replaceChildren(...lesson.stages.map(stage => {
    const button = textElement('button', stage.title, 'stage-item');
    button.dataset.lesson = lesson.id; button.dataset.stage = stage.id;
    button.id = `stage-tab-${stage.id}`;
    const active = current ? current.stage.id === stage.id : stage === lesson.stages[0];
    button.classList.toggle('active', active);
    button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(active));
    button.setAttribute('aria-controls', `${stage.kind}-page`);
    button.tabIndex = active ? 0 : -1;
    button.disabled = busy;
    if (completed.has(`${lesson.id}/${stage.id}`)) button.append(textElement('span', '✓', 'completed-mark'));
    button.addEventListener('click', guard(() => loadStage(lesson.id, stage.id)));
    return button;
  }));
  if (focusedStage) document.getElementById(`stage-tab-${focusedStage}`)?.focus();
}

function updateProgress(values) {
  if (values) completed = new Set(values.map(([lesson, stage]) => `${lesson}/${stage}`));
  const all = bootstrap.lessons.flatMap(lesson => lesson.stages.map(stage => `${lesson.id}/${stage.id}`));
  const count = all.filter(key => completed.has(key)).length;
  $('progress-count').textContent = `${count} / ${all.length}`;
  $('progress-fill').style.width = `${count / Math.max(1, all.length) * 100}%`;
  buildCourses($('course-search').value.trim());
}

async function loadStage(lesson, stage, options = {}) {
  if (busy) { toast('请等待判题结束，或先点击“停止”。'); $('language').value = language; return; }
  if (loading) return;
  pause(); loading = true;
  try {
    await Promise.all([saveDraft(), saveNotes()]);
    const nextLanguage = options.language || language;
    const next = await api.loadStage({ lesson, stage, language: nextLanguage });
    current = next; language = nextLanguage;
    $('language').value = language;
    $('document-title').textContent = current.title;
    $('lesson-title').textContent = current.title;
    const chapter = courseOutline.find(group => group.lessons.includes(current.title));
    $('breadcrumb').textContent = `${chapter?.title || '课程'}  /  ${current.title}`;
    $('animation-tools').hidden = current.stage.kind !== 'animation';
    $('stage-badge').hidden = current.stage.kind === 'animation';
    $('stage-badge').textContent = current.stage.kind === 'animation' ? '可视化学习' : current.stage.kind === 'practice' ? '动手编程' : '知识拓展';
    for (const page of ['animation', 'practice']) $(page + '-page').hidden = current.stage.kind !== page;
    $('problem-source').hidden = !current.problem?.source?.url;
    $('notes').value = current.note;
    $('note-title').textContent = `${current.title} · 课程笔记`;
    $('note-state').textContent = '自动保存'; noteDirty = false;
    updateKnowledgeTree();
    if (current.stage.kind === 'animation') {
      const demo = learningDemos[current.stage.source];
      $('array-canvas').classList.toggle('learning-mode', Boolean(demo));
      $('concept-scene').hidden = !demo;
      $('animation-input-label').textContent = demo?.inputLabel || '初始数组';
      $('generate').textContent = demo ? '生成演示' : '生成数组';
      $('array-input').placeholder = demo ? '1～8 个整数' : '1～16 个整数';
      $('counter-one-label').textContent = demo?.counters[0] || '比较';
      $('counter-two-label').textContent = demo?.counters[1] || '交换';
      $('legend-active').textContent = demo ? '当前操作' : '当前比较';
      $('legend-complete').textContent = demo ? '已处理' : '已归位';
      markdown($('aux-explanation'), current.markdown);
      $('target-input').hidden = current.stage.source !== 'binary_search';
      $('array-input').value = demo ? demo.defaults.join(', ') : current.stage.source === 'binary_search' ? '1, 2, 3, 4, 5, 6, 7, 8' : '5, 2, 8, 1, 6, 3, 7, 4';
      generate();
    } else if (current.stage.kind === 'practice') {
      markdown($('statement'), current.problem.statement);
      $('reference-code').textContent = current.reference;
      editor.setValue(current.draft, -1); draftDirty = false;
      $('draft-state').textContent = '已保存';
      const filename = current.problem.source?.id.toLowerCase() || (current.lesson === 'sorting.bubble_sort' ? 'bubble_sort' : current.lesson.split('.').at(-1));
      $('filename').textContent = `${filename}.${language === 'C' ? 'c' : 'cpp'}`;
      if (current.problem.source) $('stage-badge').textContent = `${current.problem.source.platform} ${current.problem.source.id}`;
      clearOutput(); renderHistory(current.history);
      questionTab('statement'); outputTab('output');
      requestAnimationFrame(() => editor.resize());
    }
    updateProgress();
    $('status-message').textContent = `${current.title} · ${current.stage.title}`;
  } finally { loading = false; $('language').value = language; }
}

function showPanel(panel) {
  const titles = { courses: '数据结构与算法', mindmap: '思维导图', notes: '笔记本', ai: 'AI 辅助' };
  $('sidebar-title').textContent = titles[panel];
  for (const key of Object.keys(titles)) $('panel-' + key).hidden = panel !== key;
  document.querySelectorAll('[data-panel]').forEach(button => button.classList.toggle('active', button.dataset.panel === panel));
}

function updateKnowledgeTree() {
  const tree = $('knowledge-tree'); tree.replaceChildren();
  tree.append(textElement('div', current.title, 'knowledge-node'));
  const branches = lessonDemo(current.lesson)?.knowledge || (current.stage.source === 'binary_search'
    ? { 前提: ['数组必须有序'], 过程: ['取中点', '排除一半区间', '检查空区间'], 复杂度: ['时间 O(log n)', '空间 O(1)'] }
    : { 核心思路: ['比较相邻元素', '交换逆序元素', '逐轮归位'], 复杂度: ['一般 / 最坏 O(n²)', '提前结束时最好 O(n)', '额外空间 O(1)'], 算法性质: ['稳定排序', '原地排序'], 边界情况: ['单个元素', '重复值与负数', '已经有序', '完全逆序'] });
  for (const [name, leaves] of Object.entries(branches)) {
    const branch = textElement('div', '', 'knowledge-branch');
    branch.append(textElement('h4', name));
    leaves.forEach(leaf => branch.append(textElement('p', leaf))); tree.append(branch);
  }
}

function generate() {
  $('array-canvas').dataset.demo = current.stage.source;
  const demo = learningDemos[current.stage.source];
  const values = demo ? parseLearningInput(current.stage.source, $('array-input').value) : parseArray($('array-input').value);
  let generated;
  if (demo) generated = learningSteps(current.stage.source, values);
  else if (current.stage.source === 'binary_search') {
    const target = Number($('target-input').value);
    if (!Number.isSafeInteger(target)) throw new Error('目标值必须为整数。');
    generated = binarySteps(values, target);
  } else generated = bubbleSteps(values);
  pause(); steps = generated; stepIndex = 0; cellOrder = [];
  $('timeline').max = steps.length - 1;
  buildRoundOptions(); renderStep(false);
}

function buildRoundOptions() {
  const options = [new Option('初始状态', '0')];
  const seen = new Set();
  for (let index = 1; index < steps.length - 1; index++) {
    const step = steps[index];
    if (learningDemos[current.stage.source]) {
      if (step.phase && !seen.has(step.phase)) {
        seen.add(step.phase); options.push(new Option(step.phase, String(index)));
      }
      continue;
    }
    if (step.action !== 'compare') continue;
    const round = current.stage.source === 'binary_search' ? index : step.variables.i;
    if (seen.has(round)) continue;
    seen.add(round);
    options.push(new Option(`第 ${seen.size} ${current.stage.source === 'binary_search' ? '步' : '轮'}`, String(index)));
  }
  options.push(new Option('演示完成', String(steps.length - 1)));
  $('round-select').replaceChildren(...options);
}

function pause() {
  clearTimeout(playTimer); playTimer = null;
  $('play').replaceChildren(icon('play'), textElement('span', '播放'));
}

function schedulePlay() {
  playTimer = setTimeout(() => {
    if (stepIndex < steps.length - 1) { stepIndex++; renderStep(true); }
    if (stepIndex < steps.length - 1) schedulePlay(); else pause();
  }, 950 / (Number($('speed').value) / 100));
}

function togglePlay() {
  if (playTimer) { pause(); return; }
  if (stepIndex === steps.length - 1) { stepIndex = 0; cellOrder = []; renderStep(false); }
  $('play').replaceChildren(icon('pause'), textElement('span', '暂停'));
  schedulePlay();
}

function seek(index, animate = false) {
  pause(); stepIndex = Math.min(Math.max(index, 0), steps.length - 1); renderStep(animate);
}

function positionCells(step) {
  const stage = $('array-stage');
  if (!stage.parentElement.clientWidth) return;
  const longest = Math.max(...step.values.map(value => String(value).length));
  const minSlot = Math.max(45, longest * 8 + 18);
  const preferredSlot = Math.max(step.values.length > 10 ? 58 : 76, minSlot);
  const width = Math.max(step.values.length * minSlot,
    Math.min(stage.parentElement.clientWidth - 16, step.values.length * preferredSlot));
  stage.style.width = `${width}px`;
  stage.style.setProperty('--slot', `${width / step.values.length}px`);
  cellOrder.forEach((cell, index) => {
    cell.style.setProperty('--index', index);
    cell.style.fontSize = `${String(step.values[index]).length > 4 ? 13 : step.values.length > 10 ? 18 : 24}px`;
  });
}

function renderStep(animate) {
  const step = steps[stepIndex]; if (!step) return;
  const demo = learningDemos[current.stage.source];
  cellAnimations.forEach(animation => animation.cancel()); cellAnimations = [];
  const stage = $('array-stage');
  const previous = cellOrder.map(cell => Number(cell.dataset.value));
  let swap = animate && step.action === 'swap' && previous.length === step.values.length && step.highlighted.length === 2;
  let oldRects;
  if (swap) {
    const [a, b] = step.highlighted;
    const predicted = [...previous]; [predicted[a], predicted[b]] = [predicted[b], predicted[a]];
    swap = predicted.every((value, index) => value === step.values[index]);
    if (swap) {
      oldRects = new Map(cellOrder.map(cell => [cell, cell.getBoundingClientRect()]));
      [cellOrder[a], cellOrder[b]] = [cellOrder[b], cellOrder[a]];
    }
  }
  if (!swap && (previous.length !== step.values.length || previous.some((value, index) => value !== step.values[index]))) {
    cellOrder = step.values.map(value => {
      const cell = textElement('div', value, 'array-cell'); cell.dataset.value = value; return cell;
    });
  }
  stage.replaceChildren(...cellOrder);
  cellOrder.forEach((cell, index) => {
    cell.querySelector('.pointer-label')?.remove();
    cell.classList.toggle('compared', step.highlighted.includes(index));
    cell.classList.toggle('settled', step.settled.includes(index) && !step.highlighted.includes(index));
    if (step.highlighted.includes(index)) cell.append(textElement('span', demo ? step.pointers?.[index] || 'i' : current.stage.source === 'binary_search' ? 'mid' : index === step.highlighted[0] ? 'j' : 'j + 1', 'pointer-label'));
    const nodeDemo = ['singly_links', 'circular_links', 'doubly_links'].includes(current.stage.source);
    const label = textElement('span', current.stage.source === 'student_records' ? `id=${index + 1}` : nodeDemo ? `#${index + 1}` : index, 'array-index'); label.style.setProperty('--index', index); stage.append(label);
  });
  if (!demo && step.highlighted.length === 2 && (step.action === 'swap' ||
    (step.action === 'compare' && step.values[step.highlighted[0]] > step.values[step.highlighted[1]]))) {
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.classList.add('swap-arc'); arrow.setAttribute('viewBox', '0 0 80 28');
    arrow.setAttribute('preserveAspectRatio', 'none'); arrow.setAttribute('aria-hidden', 'true');
    arrow.style.setProperty('--from', step.highlighted[0]);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M2 24 Q40 -10 78 24 M69 21 L78 24 L75 15');
    arrow.append(path); stage.append(arrow);
  }
  positionCells(step);
  if (swap) {
    for (const index of step.highlighted) {
      const cell = cellOrder[index];
      const dx = oldRects.get(cell).left - cell.getBoundingClientRect().left;
      cellAnimations.push(cell.animate([
        { transform: `translate(${dx}px,0)` }, { transform: `translate(${dx / 2}px,${dx > 0 ? -23 : 23}px)` },
        { transform: 'translate(0,0)' },
      ], { duration: 400 / (Number($('speed').value) / 100), easing: 'cubic-bezier(.4,0,.2,1)' }));
    }
  }
  $('round-label').textContent = demo ? step.phase : step.action === 'start' || step.action === 'done' ? actionNames[step.action]
    : `${current.stage.source === 'binary_search' ? '区间查找' : `第 ${step.variables.i + 1} 轮`} · ${actionNames[step.action]}`;
  $('step-count').textContent = `${String(stepIndex + 1).padStart(2, '0')} / ${steps.length}`;
  $('canvas-message').textContent = step.explanation;
  for (const option of $('round-select').options) {
    if (Number(option.value) <= stepIndex) $('round-select').value = option.value;
  }
  $('timeline').value = stepIndex;
  $('previous').disabled = stepIndex === 0; $('next').disabled = stepIndex === steps.length - 1;
  $('variables').replaceChildren(...Object.entries(step.variables).map(([key, value]) => {
    const row = textElement('div', '', 'variable-row');
    row.append(textElement('span', key), textElement('b', value)); return row;
  }));
  renderOperations();
  $('mini-array').replaceChildren(...step.values.map((value, index) => textElement('span', value,
    step.highlighted.includes(index) ? 'compared' : step.settled.includes(index) ? 'settled' : '')));
  $('action-title').textContent = step.label || learningActionNames[step.action] || actionNames[step.action] || step.action;
  $('step-explanation').textContent = step.explanation;
  $('step-tip').textContent = step.action === 'swap' ? '一次相邻交换，会减少多少个逆序对？'
    : step.action === 'done' ? '试试重复值、负数或已经有序的数组。' : '为什么每一轮可以少比较一个元素？';
  $('flow-caption').textContent = current.stage.source === 'binary_search' ? '每次排除一半的候选区间' : '较大的元素逐步向右移动';
  if (current.stage.source === 'binary_search') $('step-tip').textContent = '比较中点后，哪一半区间可以排除？';
  if (demo) {
    $('step-tip').textContent = demo.tip;
    $('flow-caption').textContent = demo.flow;
    renderConceptScene(step, demo);
  }
  $('array-state').replaceChildren(...step.values.map((value, index) => {
    const state = step.highlighted.includes(index) ? 'compared' : step.settled.includes(index) ? 'settled' : '';
    const column = textElement('div', '', `array-state-column ${state}`);
    column.append(textElement('span', `[${index}]`), textElement('b', value),
      textElement('small', state === 'compared' ? demo ? '操作中' : '比较中' : state === 'settled' ? demo ? '已处理' : '已归位' : '待处理'));
    return column;
  }));
  if (stepIndex === steps.length - 1) markComplete().catch(error => toast(error.message));
}

function renderConceptScene(step, demo) {
  const container = $('concept-scene'); container.replaceChildren();
  const body = textElement('div', '', 'scene-body');
  const visual = textElement('div', '', 'scene-visual');
  const source = current.stage.source;
  const line = (label, values, empty) => {
    const row = textElement('div', '', 'scene-line');
    row.append(textElement('span', label, 'scene-label'));
    if (!values.length) row.append(textElement('span', empty, 'scene-empty'));
    values.forEach((value, i) => row.append(textElement('span', value, `scene-chip ${i === values.length - 1 ? 'active' : ''}`)));
    visual.append(row);
  };
  if (source === 'linear_sum') {
    visual.append(textElement('h4', '累计器 · 每读一个元素更新一次'));
    const total = textElement('div', '', 'sum-card');
    total.append(textElement('span', 'sum'), textElement('b', step.scene.sum)); visual.append(total);
    visual.append(textElement('p', `已读取 ${step.counters[0]} / ${step.values.length} 个元素 · O(n)`, 'scene-note'));
  } else if (['singly_links', 'circular_links', 'doubly_links'].includes(source)) {
    const { nodes, head, current: active, order, ring, double, output } = step.scene;
    const ref = id => id === null ? 'NULL' : `#${id}`;
    visual.append(textElement('h4', `${double ? 'prev ← 节点 → next' : '节点 → next'} · 编号非真实地址`));
    const consistent = !double || order.every((id, i) => nodes[id - 1].prev === (order[i - 1] ?? null));
    const path = textElement('div', `head ${ref(head)} · ${order.map(ref).join(double && consistent ? ' ⇄ ' : ' → ')}${order.length ? ring ? ` → ${ref(head)}（回到起点）` : ' → NULL' : '（空链）'}${consistent ? '' : ' · 反向连接更新中'}`, 'link-path');
    const cards = textElement('div', '', 'record-grid link-nodes');
    nodes.forEach(node => {
      const card = textElement('div', '', `record-card link-node ${node.id === active ? 'active' : ''} ${node.removed ? 'removed' : ''}`);
      card.dataset.node = node.id;
      card.append(textElement('small', `#${node.id}${node.removed ? ' · 已摘除' : order.includes(node.id) ? '' : ' · 未在前向链上'}`), textElement('b', node.value));
      if (double) card.append(textElement('span', `prev: ${ref(node.prev)}`));
      card.append(textElement('span', `next: ${ref(node.next)}`)); cards.append(card);
    });
    visual.append(path, cards);
    if (output) line('出圈顺序', output, '（尚未出圈）');
  } else if (source === 'stack_intro' || source === 'stack_operations') {
    visual.append(textElement('h4', '栈底 → 栈顶 · 右侧为栈顶'));
    line('当前栈', step.scene.stack, '（空栈）');
    line('已输出', step.scene.output, '（尚未输出）');
    if (source === 'stack_operations') visual.append(textElement('p', 'peek 只读栈顶，不改变 top；pop 才移除。', 'scene-note'));
  } else if (source === 'queue_operations') {
    visual.append(textElement('h4', `顺序队列 · front=${step.scene.front}, rear=${step.scene.rear} · 不循环`));
    const slots = textElement('div', '', 'record-grid queue-slots');
    step.values.forEach((_, i) => {
      const valid = i >= step.scene.front && i < step.scene.rear;
      const slot = textElement('div', '', `record-card ${valid ? 'active' : ''}`);
      slot.append(textElement('small', `槽位 ${i}`), textElement('b', i < step.scene.rear ? step.scene.slots[i] : '—'),
        textElement('span', valid ? '队列内' : i < step.scene.front ? '已出队' : '未使用'));
      slots.append(slot);
    });
    visual.append(slots);
    line('有效队列', step.scene.queue, '（空队列）');
    line('已输出', step.scene.output, '（尚未输出）');
  } else if (source === 'loop_analysis') {
    const { n, linear, nested } = step.scene;
    visual.append(textElement('h4', '执行次数 · 每格对应一对 (i, j)'));
    const grid = textElement('div', '', 'loop-grid'); grid.style.setProperty('--grid-n', n);
    for (let i = 0; i < n * n; ++i) {
      const item = textElement('span', `${Math.floor(i / n)},${i % n}`, `loop-slot ${i < nested ? 'visited' : ''} ${nested > 0 && i === nested - 1 ? 'active' : ''}`);
      grid.append(item);
    }
    visual.append(grid);
    for (const [name, value, maximum] of [['单层 O(n)', linear, n], ['双层 O(n²)', nested, n * n]]) {
      const row = textElement('div', '', 'count-bar');
      const track = textElement('div', '', 'count-track');
      const fill = textElement('span', ''); fill.style.width = `${value / maximum * 100}%`; track.append(fill);
      row.append(textElement('span', name), track, textElement('b', `${value}/${maximum}`)); visual.append(row);
    }
  } else if (source === 'student_records') {
    visual.append(textElement('h4', 'Student 记录 · 字段逻辑示意'));
    const records = textElement('div', '', 'record-grid');
    step.scene.records.forEach((record, i) => {
      const card = textElement('div', '', `record-card ${i === step.scene.active ? 'active' : ''} ${record.id === step.scene.best.id ? 'best' : ''}`);
      card.append(textElement('small', `a[${i}]${record.id === step.scene.best.id ? ' · best' : ''}`),
        textElement('span', `id: ${record.id}`), textElement('span', `score: ${record.score}`)); records.append(card);
    });
    visual.append(records, textElement('p', `best = { id: ${step.scene.best.id}, score: ${step.scene.best.score} }`, 'scene-note'));
  } else if (source === 'array_access') {
    visual.append(textElement('h4', '地址映射 · 假设 int 占 4 字节'));
    const addresses = textElement('div', '', 'address-grid');
    step.scene.addresses.forEach((address, i) => {
      const item = textElement('div', '', `address-card ${step.highlighted.includes(i) ? 'active' : ''}`);
      item.append(textElement('small', `a[${i}]`), textElement('b', address)); addresses.append(item);
    });
    visual.append(addresses, textElement('p', '基址 1000 + 下标 × 4；不是实际程序地址，真实大小用 sizeof(int)。', 'scene-note'));
  }
  const code = textElement('div', '', 'scene-code'); code.append(textElement('h4', '当前语句 · C 思路示意'));
  demo.code.forEach((value, i) => {
    const row = textElement('div', '', `scene-code-line ${i === step.codeLine ? 'active' : ''}`);
    row.append(textElement('span', i + 1), textElement('code', value)); code.append(row);
  });
  body.append(visual, code); container.append(body);
}

function renderOperations() {
  const elapsed = steps.slice(0, stepIndex + 1);
  const demo = learningDemos[current.stage.source], currentStep = steps[stepIndex];
  $('compare-count').textContent = demo ? currentStep.counters[0] : elapsed.filter(step => step.action === 'compare').length;
  $('swap-count').textContent = demo ? currentStep.counters[1] : elapsed.filter(step => step.action === 'swap').length;
  const first = Math.max(0, stepIndex - 1), last = Math.min(steps.length, first + 5);
  $('operation-list').replaceChildren(...steps.slice(first, last).map((step, offset) => {
    const index = first + offset;
    const label = step.label || (step.action === 'compare'
      ? step.highlighted.map(value => `a[${value}]`).join(' 与 ') : learningActionNames[step.action] || actionNames[step.action] || step.action);
    const row = textElement('button', '', `operation-row ${index === stepIndex ? 'current' : index > stepIndex ? 'pending' : ''}`);
    row.dataset.step = index;
    row.title = step.explanation;
    row.setAttribute('aria-label', `跳转到第 ${index + 1} 步：${step.explanation}`);
    if (index === stepIndex) row.setAttribute('aria-current', 'step');
    row.append(textElement('span', index + 1, 'operation-number'), textElement('span', step.action === 'compare' ? `比较 ${label}` : label));
    row.addEventListener('click', () => seek(index));
    return row;
  }));
}

async function markComplete() {
  if (!current || completed.has(`${current.lesson}/${current.stage.id}`)) return;
  const values = await api.complete({ lesson: current.lesson, stage: current.stage.id });
  updateProgress(values);
}

function auxTab(value) {
  for (const key of ['details', 'state', 'explanation']) $('aux-' + key).hidden = value !== key;
  document.querySelectorAll('[data-aux]').forEach(button => button.classList.toggle('active', button.dataset.aux === value));
}
function questionTab(value) {
  $('statement').hidden = value !== 'statement'; $('reference-code').hidden = value !== 'reference';
  document.querySelectorAll('[data-question]').forEach(button => button.classList.toggle('active', button.dataset.question === value));
}
function outputTab(value) {
  for (const key of ['output', 'cases', 'history']) $(key).hidden = key !== value;
  document.querySelectorAll('[data-output]').forEach(button => button.classList.toggle('active', button.dataset.output === value));
}

function clearOutput() {
  $('output').replaceChildren(); $('cases').replaceChildren();
  terminalSize = 0; terminalTruncated = false;
  const raw = current?.stage.id === 'exam';
  $('output').classList.toggle('raw-terminal', raw);
  if (raw) $('output').append(textElement('pre', '', 'terminal-text'));
  $('judge-status').textContent = raw ? 'Ready' : '就绪'; $('judge-status').className = 'judge-status';
}

function appendTerminal(event) {
  if (current?.stage.id !== 'exam' || terminalTruncated) return;
  const terminal = $('output').querySelector('.terminal-text');
  if (!terminal || typeof event.text !== 'string') return;
  const limit = 4 * 1024 * 1024;
  const text = event.text.slice(0, Math.max(0, limit - terminalSize));
  const style = event.kind === 'command' ? 'terminal-command' : event.channel === 'stderr' ? 'terminal-stderr' : '';
  terminal.append(textElement('span', text, style));
  terminalSize += text.length;
  if (text.length < event.text.length) {
    terminalTruncated = true;
    terminal.append(document.createTextNode('\n[Terminal display limit reached]\n'));
  }
  $('output').scrollTop = $('output').scrollHeight;
}

function log(message, status = '') {
  $('output').append(textElement('div', message, `log-line ${status}`));
  while ($('output').children.length > 300) $('output').firstChild.remove();
  $('output').scrollTop = $('output').scrollHeight;
}

function setBusy(value) {
  busy = value;
  for (const id of ['run', 'submit', 'custom-open', 'language']) $(id).disabled = value;
  $('stop').disabled = !value; editor.setReadOnly(value); buildCourses($('course-search').value.trim());
}

async function runJudge(mode, input = '') {
  if (busy || loading || current?.stage.kind !== 'practice') return;
  await saveDraft(); clearOutput(); outputTab('output'); setBusy(true);
  $('judge-status').textContent = current.stage.id === 'exam' ? 'Compiling…' : '正在编译…';
  try {
    await api.judge({ lesson: current.lesson, stage: current.stage.id, language, code: editor.getValue(), mode, input });
  } catch (error) { setBusy(false); if (current.stage.id !== 'exam') log(error.message, 'bad'); toast(error.message); }
}

function renderCase(result) {
  const good = result.verdict === 'AC' || result.verdict === 'RUN';
  const item = textElement('details', '', `case-item ${good ? 'good' : 'bad'}`);
  const summary = textElement('summary', result.name);
  summary.append(textElement('b', `${result.verdict}  ·  ${result.elapsed_ms} ms`));
  item.append(summary, textElement('pre', `实际输出：\n${result.actual.slice(0, 20000)}\n\n预期输出：\n${(result.expected ?? '（自定义输入不比较答案）').slice(0, 20000)}\n\n标准错误：\n${result.stderr.slice(0, 20000)}`));
  $('cases').append(item);
  if (current.stage.id !== 'exam') {
    log(`${result.name}   ${result.verdict}   ${result.elapsed_ms} ms`, good ? 'good' : 'bad');
    if (result.expected === null) log(result.actual.slice(0, 20000));
  }
}

function renderHistory(records) {
  const modeNames = { sample: '样例', submit: '提交', custom: '自定义' };
  $('history').replaceChildren();
  for (const [verdict, mode, created] of records) {
    const row = textElement('div', '', 'history-row');
    row.append(textElement('span', created.replace('T', ' ')), textElement('span', modeNames[mode] || mode), textElement('b', verdict));
    $('history').append(row);
  }
  if (!records.length) $('history').append(textElement('p', '暂无提交记录'));
}

function attachEvents() {
  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
  document.querySelectorAll('[data-window]').forEach(button => button.addEventListener('click', () => api.window(button.dataset.window)));
  document.querySelectorAll('[data-aux]').forEach(button => button.addEventListener('click', () => auxTab(button.dataset.aux)));
  document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => questionTab(button.dataset.question)));
  document.querySelectorAll('[data-output]').forEach(button => button.addEventListener('click', () => outputTab(button.dataset.output)));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  document.querySelectorAll('[data-compiler]').forEach(button => button.addEventListener('click', guard(async () => {
    const selected = await api.pickCompiler(); if (selected) $(button.dataset.compiler).value = selected;
  })));
  $('course-search').addEventListener('input', () => buildCourses($('course-search').value.trim()));
  $('course-reveal').addEventListener('click', () => { showPanel('courses'); $('course-search').focus(); });
  $('stage-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || busy || loading) return;
    const tabs = [...$('stage-tabs').querySelectorAll('button')];
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[target].focus(); tabs[target].click();
  });
  $('generate').addEventListener('click', guard(generate));
  $('array-input').addEventListener('keydown', event => { if (event.key === 'Enter') guard(generate)(); });
  $('play').addEventListener('click', togglePlay);
  $('previous').addEventListener('click', () => seek(stepIndex - 1));
  $('next').addEventListener('click', () => seek(stepIndex + 1, true));
  $('reset').addEventListener('click', () => seek(0));
  $('reset-view').addEventListener('click', () => seek(0));
  $('round-select').addEventListener('change', () => seek(Number($('round-select').value)));
  $('timeline').addEventListener('input', () => seek(Number($('timeline').value)));
  $('speed').addEventListener('input', () => {
    if (playTimer) { clearTimeout(playTimer); schedulePlay(); }
  });
  $('speed').addEventListener('change', guard(() => api.saveSettings({ speed: Number($('speed').value) })));
  $('language').addEventListener('change', guard(() => loadStage(current.lesson, current.stage.id, { language: $('language').value })));
  $('run').addEventListener('click', guard(() => runJudge('sample')));
  $('submit').addEventListener('click', guard(() => runJudge('submit')));
  $('stop').addEventListener('click', guard(() => api.cancel()));
  $('custom-open').addEventListener('click', () => $('custom-dialog').showModal());
  $('custom-run').addEventListener('click', guard(async () => { $('custom-dialog').close(); await runJudge('custom', $('custom-input').value); }));
  $('notes').addEventListener('input', () => {
    noteDirty = true; $('note-state').textContent = '正在保存…'; clearTimeout(noteTimer);
    noteTimer = setTimeout(() => saveNotes().catch(error => toast(error.message)), 500);
  });
  $('copy-question').addEventListener('click', guard(async () => { await navigator.clipboard.writeText($('ai-question').value); toast('问题已复制'); }));
  $('help-open').addEventListener('click', () => $('help-dialog').showModal());
  $('problem-source').addEventListener('click', guard(() => api.openSource({ url: current.problem.source.url })));
  $('settings-open').addEventListener('click', () => {
    if (busy) { toast('请在判题结束后修改设置'); return; }
    $('gcc-path').value = bootstrap.settings.gcc || '';
    $('gxx-path').value = bootstrap.settings['g++'] || '';
    $('settings-dialog').showModal();
  });
  $('settings-save').addEventListener('click', guard(async () => {
    bootstrap.settings = await api.saveSettings({ gcc: $('gcc-path').value.trim(), 'g++': $('gxx-path').value.trim() });
    $('settings-dialog').close(); toast('编译器设置已保存');
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'F5') { event.preventDefault(); guard(() => runJudge('sample'))(); }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); guard(() => runJudge('submit'))(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); guard(saveAll)(); }
  });
  new ResizeObserver(() => { if (steps.length) positionCells(steps[stepIndex]); }).observe($('array-stage').parentElement);
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    if (/^https:\/\/www\.luogu\.com\.cn\/problem\/[PB][1-9]\d*$/.test(link.href)) guard(() => api.openSource({ url: link.href }))();
  });
  api.onEvent(guard(async message => {
    if (message.event === 'log' && current?.stage.id !== 'exam') log(message.payload);
    if (message.event === 'terminal') appendTerminal(message.payload);
    if (message.event === 'case') renderCase(message.payload);
    if (message.event === 'finished') {
      const result = message.payload; setBusy(false);
      const good = result.verdict === 'AC' || result.verdict === 'RUN';
      if (current.stage.id !== 'exam') log(`\n${result.verdict} · ${result.message}`, good ? 'good' : 'bad');
      $('judge-status').textContent = result.verdict;
      $('judge-status').className = `judge-status ${good ? 'good' : 'bad'}`;
      updateProgress(result.completed); renderHistory(result.history);
      $('status-message').textContent = `${result.verdict} · ${result.message}`;
    }
    if (message.event === 'backend-error' && !closing) {
      $('connection-dot').style.background = '#f18b99'; $('connection-label').textContent = '本地服务离线'; toast(message.payload);
    }
    if (message.event === 'prepare-close' && !closing) {
      closing = true; pause();
      try { await Promise.all([saveDraft(), saveNotes()]); await api.closeReady(); }
      catch (error) { closing = false; toast(`关闭前保存失败：${error.message}`); }
    }
  }));
}

async function start() {
  if (!api) throw new Error('请使用“启动.bat”打开桌面软件，直接用浏览器打开不能调用编译器。');
  makeEditor(); attachEvents();
  bootstrap = await api.bootstrap();
  updateProgress(bootstrap.completed);
  $('data-directory').textContent = bootstrap.dataDirectory;
  $('connection-label').textContent = '本地判题已连接';
  $('speed').value = bootstrap.settings.speed || 100;
  const lesson = bootstrap.lessons.find(lesson => lesson.id === bootstrap.settings.last_lesson) || bootstrap.lessons[0];
  const stage = lesson.stages.find(stage => stage.id === bootstrap.settings.last_stage) || lesson.stages[0];
  await loadStage(lesson.id, stage.id);
}

start().catch(error => { $('connection-label').textContent = '启动失败'; toast(error.message); });
