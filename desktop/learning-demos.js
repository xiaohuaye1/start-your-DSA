import { parseArray } from './algorithms.js';
import { linearDemos } from './linear-demos.js';
import { sortingDemos } from './sorting-demos.js';
import { advancedDemos } from './advanced-demos.js';
import { finalDemos } from './final-demos.js';

// Each frame owns its data, so seeking backwards restores a complete snapshot.
function frames(input) {
  const steps = [];
  return { steps, add(action, explanation, state = {}) {
    steps.push(structuredClone({ values: [...input], highlighted: [], settled: [],
      variables: {}, counters: [0, 0], codeLine: 0, scene: {}, action, explanation, ...state }));
  } };
}
const range = n => Array.from({ length: n }, (_, i) => i);

export function sumSteps(input) {
  const { steps, add } = frames(input), n = input.length;
  let sum = 0, reads = 0;
  const state = (i, extra = {}) => ({ variables: { i, n, sum, reads },
    counters: [reads, i + (extra.actionCount || 0)], scene: { sum }, ...extra });
  add('start', '输入已就绪：把 sum 初始化为 0。', state(0, { phase: '初始化' }));
  for (let i = 0; i < n; ++i) {
    ++reads;
    add('read', `读取 a[${i}] = ${input[i]}，这是第 ${reads} 次访问。`, state(i, {
      counters: [reads, i], phase: '顺序遍历', codeLine: 1, highlighted: [i],
      settled: range(i), pointers: { [i]: 'i' }, label: `读取 a[${i}]`,
    }));
    const before = sum; sum += input[i];
    add('accumulate', `sum = ${before} + ${input[i]} = ${sum}。`, state(i, {
      counters: [reads, i + 1], phase: '顺序遍历', codeLine: 2, highlighted: [i],
      settled: range(i + 1), pointers: { [i]: 'i' }, label: `累加 ${input[i]}`,
    }));
  }
  add('done', `总和为 ${sum}；访问 ${n} 次，时间 O(n)，额外空间 O(1)。`, state(n, {
    counters: [n, n], settled: range(n), codeLine: 3, phase: '输出结果',
  }));
  return steps;
}

export function stackSteps(input) {
  const { steps, add } = frames(input), n = input.length, stack = [], output = [];
  let pushes = 0, pops = 0;
  const state = extra => ({ variables: { n, top: stack.length - 1, pushes, pops },
    counters: [pushes, pops], scene: { stack, output }, ...extra });
  add('start', '栈最初为空，top = -1。先顺序入栈，再依次出栈。', state({ phase: '初始化' }));
  input.forEach((value, i) => {
    stack.push(value); ++pushes;
    add('push', `${value} 入栈，栈顶下标变为 ${stack.length - 1}。`, state({
      phase: '入栈', codeLine: 1, highlighted: [i], settled: range(i),
      pointers: { [i]: 'push' }, label: `入栈 ${value}`,
    }));
  });
  for (let i = n - 1; i >= 0; --i) {
    const value = stack.pop(); output.push(value); ++pops;
    add('pop', `从栈顶取出 ${value}；它比左侧的数字更晚入栈。`, state({
      phase: '出栈', codeLine: 2, highlighted: [i], settled: range(n).filter(j => j > i),
      pointers: { [i]: 'pop' }, label: `出栈 ${value}`,
    }));
  }
  add('done', `栈已清空，输出为 ${output.join(' ')}：后进先出。`, state({
    phase: '输出结果', codeLine: 3, settled: range(n),
  }));
  return steps;
}

export function loopSteps(input) {
  const { steps, add } = frames(input), n = input.length;
  let linear = 0, nested = 0;
  const state = (i, j, extra = {}) => ({ variables: { n, i, j, linear, nested },
    counters: [linear, nested], scene: { n, linear, nested }, ...extra });
  add('start', `n = ${n}：比较 n 次与 n² = ${n * n} 次。数值不影响循环次数。`, state(0, '-', { phase: '初始化' }));
  for (let i = 0; i < n; ++i) {
    ++linear;
    add('execute', `单层循环第 ${linear} 次执行，i = ${i}。`, state(i, '-', {
      phase: '单层循环', codeLine: 1, highlighted: [i], settled: range(i),
      pointers: { [i]: 'i' }, label: `单层 i = ${i}`,
    }));
  }
  for (let i = 0; i < n; ++i) for (let j = 0; j < n; ++j) {
    ++nested;
    add('execute', `双层循环执行 (i,j) = (${i},${j})，累计 ${nested} 次。`, state(i, j, {
      phase: '双层循环', codeLine: 3, highlighted: [...new Set([i, j])],
      pointers: { [i]: i === j ? 'i = j' : 'i', ...(i === j ? {} : { [j]: 'j' }) },
      label: `双层 (${i}, ${j})`,
    }));
  }
  add('done', `单层 ${linear} 次，双层 ${nested} 次。n 翻倍时，后者增长约 4 倍。`, state(n, '-', {
    phase: '分析结果', codeLine: 4, settled: range(n),
  }));
  return steps;
}

export function studentSteps(input) {
  const { steps, add } = frames(input), records = input.map((score, i) => ({ id: i + 1, score }));
  let best = { ...records[0] }, comparisons = 0, updates = 0;
  const state = (i, extra = {}) => ({ variables: { i, n: input.length, 'best.id': best.id, 'best.score': best.score },
    counters: [comparisons, updates], scene: { records, best, active: i }, ...extra });
  add('start', '用第 1 条完整记录初始化 best；学号和成绩一起保存。', state(0, {
    phase: '初始化', highlighted: [0], codeLine: 0, pointers: { 0: 'best' },
  }));
  for (let i = 1; i < records.length; ++i) {
    ++comparisons;
    const record = records[i], change = record.score > best.score ||
      (record.score === best.score && record.id < best.id);
    add('inspect', `读取学生 ${record.id}：score = ${record.score}；当前 best.score = ${best.score}。`, state(i, {
      phase: '比较字段', codeLine: 1, highlighted: [i], settled: range(i),
      pointers: { [i]: 'a[i]' }, label: `比较学生 ${record.id}`,
    }));
    if (change) {
      best = { ...record }; ++updates;
      add('update', `整体复制 best = a[${i}]，现在 best 为 (${best.id}, ${best.score})。`, state(i, {
        phase: '比较字段', codeLine: 2, highlighted: [i], settled: range(i),
        pointers: { [i]: 'best' }, label: `更新完整记录 ${best.id}`,
      }));
    } else add('keep', record.score === best.score ? '成绩相同，保留学号更小的学生。' : '成绩不更高，保留当前 best。', state(i, {
      phase: '比较字段', codeLine: 1, highlighted: [i], label: '保留 best', settled: range(i + 1),
    }));
  }
  add('done', `获选记录：id = ${best.id}，score = ${best.score}。`, state(-1, {
    phase: '输出结果', codeLine: 3, settled: range(input.length),
  }));
  return steps;
}

export function arraySteps(input) {
  const { steps, add } = frames(input), values = [...input], n = input.length, index = Math.floor(n / 2);
  let accesses = 0, writes = 0;
  const state = extra => ({ values, variables: { n, index, accesses, writes },
    counters: [accesses, writes], scene: { addresses: range(n).map(i => 1000 + i * 4), index }, ...extra });
  add('start', `长度 ${n}，合法下标为 0～${n - 1}。选择中间下标 ${index}。`, state({ phase: '初始化' }));
  ++accesses;
  add('access', `直接读取 a[${index}] = ${values[index]}，不需要遍历前面的元素。`, state({
    phase: '下标访问', codeLine: 1, highlighted: [index], pointers: { [index]: 'index' }, label: `读取 a[${index}]`,
  }));
  const before = values[index]; values[index] = before + 1; ++writes;
  add('update', `a[${index}] = ${before} + 1 = ${values[index]}；其他元素不变。`, state({
    phase: '赋值修改', codeLine: 2, highlighted: [index], pointers: { [index]: 'index' }, label: `修改 a[${index}]`,
  }));
  for (let i = 0; i < n; ++i) {
    ++accesses;
    add('read', `遍历读取 a[${i}] = ${values[i]}。`, state({
      phase: '完整遍历', codeLine: 3, variables: { n, index, i, accesses, writes },
      highlighted: [i], settled: range(i), pointers: { [i]: 'i' }, label: `遍历 a[${i}]`,
    }));
  }
  add('done', '下标访问与单次修改为 O(1)，完整遍历为 O(n)。地址图仅为示意。', state({
    phase: '分析结果', codeLine: 4, settled: range(n),
  }));
  return steps;
}

export const learningDemos = {
  ...finalDemos,
  ...advancedDemos,
  ...sortingDemos,
  ...linearDemos,
  linear_sum: { lesson: 'intro.algorithm_complexity', inputLabel: '输入数组', defaults: [3, 1, 4, 2], generate: sumSteps,
    counters: ['读取', '累加'], flow: '逐个读取，每次更新累计总和', tip: '长度翻倍时，访问次数怎样变化？',
    code: ['long long sum = 0;', 'for (int i = 0; i < n; ++i) {', '    sum += a[i];', '} /* output sum */'],
    knowledge: { 算法: ['输入 → 明确步骤 → 输出', '有限性与正确性'], 复杂度: ['遍历 O(n)', '额外空间 O(1)', '增长趋势不等于实测耗时'] } },
  stack_intro: { lesson: 'intro.data_structures', inputLabel: '输入顺序', defaults: [3, 1, 4, 2], generate: stackSteps,
    counters: ['入栈', '出栈'], flow: '从栈顶取出：后进先出', tip: '为什么最后进入的元素最先输出？',
    code: ['int top = -1;', 'stack[++top] = value; /* push */', 'value = stack[top--]; /* pop, if nonempty */', '/* output reversed sequence */'],
    knowledge: { 组织方式: ['数组：下标访问', '栈：后进先出', '队列：先进先出'], 操作: ['push / pop', '空栈不能 pop', '数组逆序输出'] } },
  loop_analysis: { lesson: 'intro.algorithm_analysis', inputLabel: '元素数量示意', defaults: [1, 2, 3, 4], generate: loopSteps,
    counters: ['单层', '双层'], flow: '计数模型：n 与 n²，不是性能跑分', tip: '不能只看循环层数，还要看每层的边界。',
    code: ['int linear = 0, nested = 0;', 'for (int i = 0; i < n; ++i) ++linear;', 'for (int i = 0; i < n; ++i)', '    for (int j = 0; j < n; ++j) ++nested;', '/* compare n with n*n */'],
    knowledge: { 正确性: ['明确结果与停止条件', '浮点除法 1.0/n'], 计数: ['单层 n 次', '双层 n² 次', '按实际总执行次数分析'] } },
  student_records: { lesson: 'intro.struct_review', inputLabel: '学生成绩', defaults: [82, 95, 88, 95], generate: studentSteps,
    counters: ['比较', '复制'], flow: '按字段比较，整体复制记录', tip: '复制最高分时，是否也保存了对应学号？',
    code: ['Student best = a[0];', '/* compare a[i].score, then smaller id */', 'best = a[i]; /* copy all fields */', 'printf("%d %d", best.id, best.score);'],
    knowledge: { 定义: ['struct / typedef', '相关字段组织成记录'], 访问: ['变量.字段', '指针->字段', '结构体数组'], 规则: ['分数与学号不能拆散', '相同分数的比较顺序'] } },
  array_access: { lesson: 'linear.arrays', inputLabel: '初始数组', defaults: [3, 1, 4, 1, 5], generate: arraySteps,
    counters: ['读取', '写入'], flow: '下标直接定位，遍历逐项访问', tip: '下标从 0 开始；真实元素大小应使用 sizeof。',
    code: ['/* legal index: 0 <= index && index < n */', 'int value = a[index];', 'a[index] = value + 1;', 'for (int i = 0; i < n; ++i) /* visit a[i] */;', '/* random access O(1), traversal O(n) */'],
    knowledge: { 存储: ['同类型元素', '连续存储与下标', '地址示意不等于真实地址'], 操作: ['读取和修改 O(1)', '遍历 O(n)', '0～n-1，避免越界'] } },
};

export const lessonDemo = lesson => Object.values(learningDemos).find(demo => demo.lesson === lesson);

export function learningSteps(source, input) {
  const demo = learningDemos[source];
  if (!demo) throw new Error('未实现的课程演示。');
  if (!Array.isArray(input) || input.length < 1 || input.length > 8 ||
      input.some(value => !Number.isSafeInteger(value) || Math.abs(value) > 99999))
    throw new Error('这些演示只接受 1～8 个小整数。');
  if (source === 'student_records' && input.some(value => value < 0 || value > 100))
    throw new Error('学生成绩范围为 0～100。');
  if (demo.positiveOnly && input.some(value => value <= 0)) throw new Error('本课数据须为正整数。');
  return demo.generate(input);
}

export function parseLearningInput(source, text) {
  const values = parseArray(text);
  // Validate without creating unnecessary animation frames during parsing.
  if (!learningDemos[source] || values.length > 8) throw new Error('请输入 1～8 个整数。');
  if (source === 'student_records' && values.some(value => value < 0 || value > 100))
    throw new Error('学生成绩范围为 0～100。');
  if (learningDemos[source].positiveOnly && values.some(value => value <= 0)) throw new Error('本课数据须为正整数。');
  return values;
}
