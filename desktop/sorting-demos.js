const range = n => Array.from({ length: n }, (_, i) => i);
function recorder(input) {
  const steps = [];
  return { steps, add(action, explanation, state) {
    steps.push(structuredClone({ values: [...input], highlighted: [], settled: [],
      variables: {}, counters: [0, 0], codeLine: 0, scene: {}, action, explanation, ...state }));
  } };
}
export function ringQueueSteps(input) {
  const { steps, add } = recorder(input), capacity = Math.max(2, Math.min(3, input.length));
  const slots = Array(capacity).fill(null), output = [];
  let front = 0, rear = 0, count = 0, pushes = 0, pops = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase,
    variables: { front, rear, count, capacity, next: pushes < input.length ? input[pushes] : '—' }, counters: [pushes, pops],
    scene: { slots, front, rear, count, capacity, queue: range(count).map(i => slots[(front+i)%capacity]), output }, ...extra });
  const pop = () => {
    const index = front, value = slots[index]; front = (front+1)%capacity; --count; ++pops; output.push(value);
    add('dequeue', `从槽位 ${index} 取出 ${value}，front=(front+1)%${capacity}=${front}。旧槽位值不代表仍在队列中。`,
      state(3, '出队复用', { label: `dequeue → ${value}` }));
  };
  add('start', '用 count 区分空满；下标取模回绕，槽位旧值不属于有效队列。', state(0, '初始化'));
  input.forEach((value, index) => {
    if (count === capacity) {
      add('full', `count=${capacity}，拒绝覆盖队头。先出队腾出一个位置，再继续入队。`,
        state(1, '满队列检查', { highlighted: [index], label: 'FULL：保持原队列' }));
      pop();
    }
    const slot = rear; slots[slot] = value; rear = (rear+1)%capacity; ++count; ++pushes;
    add('enqueue', `${value} 写入槽位 ${slot}，rear 回绕规则得到 ${rear}。count=${count}。`,
      state(2, '入队与回绕', { highlighted: [index], label: `enqueue ${value} → 槽位 ${slot}` }));
  });
  while (count) pop();
  add('done', `输出 ${output.join(' ')}，保持 FIFO。现在 front==rear 且 count=0，是空而不是满。`,
    state(4, '演示完成', { settled: range(input.length) }));
  return steps;
}
export function overviewSteps(input) {
  const { steps, add } = recorder(input), n = input.length;
  const stable = input.map((value, id) => ({ value, id })), unstable = structuredClone(stable);
  let stableComparisons = 0, selectionComparisons = 0, algorithm = '准备', i = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase,
    values: (algorithm === '选择排序' ? unstable : stable).map(item => item.value),
    variables: { n, algorithm, i, stableComparisons, selectionComparisons }, counters: [stableComparisons, selectionComparisons],
    scene: { stable, unstable, algorithm }, ...extra });
  add('start', '相同值用原位置 #编号区分。排序要有序且保留元素；稳定性另外观察同值编号的顺序。', state(0, '初始化'));
  algorithm = '稳定插入';
  for (i = 1; i < n; ++i) {
    const record = stable[i]; let j = i - 1;
    while (j >= 0) {
      ++stableComparisons;
      add('compare', `稳定插入比较 ${stable[j].value} 与 ${record.value}，只移动严格更大的旧记录。`,
        state(1, '稳定性对照 · 插入', { highlighted: [j, i], label: `插入比较 #${stable[j].id+1} 与 #${record.id+1}` }));
      if (stable[j].value <= record.value) break;
      --j;
    }
    stable.splice(i, 1); stable.splice(j+1, 0, record);
    add('insert', `把 #${record.id+1} 放到位置 ${j+1}，相等的旧记录仍在它前面。`,
      state(2, '稳定性对照 · 插入', { highlighted: [j+1], label: `插入 #${record.id+1}` }));
  }
  algorithm = '选择排序';
  for (i = 0; i + 1 < n; ++i) {
    let minimum = i;
    for (let j = i+1; j < n; ++j) {
      ++selectionComparisons;
      add('compare', `直接交换版选择排序比较 ${unstable[j].value} 与当前最小值 ${unstable[minimum].value}。`,
        state(3, '稳定性对照 · 选择', { highlighted: [...new Set([j, minimum])], label: `选择比较位置 ${j}` }));
      if (unstable[j].value < unstable[minimum].value) minimum = j;
    }
    [unstable[i], unstable[minimum]] = [unstable[minimum], unstable[i]];
    add('exchange', `把本轮最小值放到位置 ${i}。跨位置交换可能改变同键记录的原顺序。`,
      state(4, '稳定性对照 · 选择', { highlighted: [...new Set([i, minimum])], settled: range(i+1), label: `完成选择位置 ${i}` }));
  }
  algorithm = '对比完成'; i = n;
  const reversed = unstable.some((item, index) => unstable.slice(0, index).some(previous => previous.value === item.value && previous.id > item.id));
  const duplicates = new Set(input).size < n;
  add('done', !duplicates ? '两种结果都有序；本组没有重复值，无法观察稳定性。试试 3,1,3,2。'
    : reversed ? '两种结果都有序，但选择排序改变了同值编号的顺序；稳定插入保留原顺序。'
      : '本组同值记录顺序都未改变，但不能据单个输入证明选择排序稳定。试试 3,1,3,2。',
    state(5, '演示完成', { settled: range(n) }));
  return steps;
}
export function selectionSteps(input) {
  const { steps, add } = recorder(input), a = [...input], n = a.length;
  let i = 0, j = 0, minimum = 0, comparisons = 0, swaps = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase, values: a,
    variables: { i, j, minimum, comparisons, swaps }, counters: [comparisons, swaps],
    settled: range(i), scene: { minimum, selected: minimum < n ? a[minimum] : null, prefix: extra.settled?.length ?? i }, ...extra });
  add('start', '每轮扫描剩余区间，先找最小值下标，再进行至多一次交换。', state(0, '初始化'));
  for (i = 0; i+1 < n; ++i) {
    minimum = i;
    for (j = i+1; j < n; ++j) {
      ++comparisons;
      add('compare', `比较 a[${j}]=${a[j]} 与 a[${minimum}]=${a[minimum]}。`,
        state(2, `第 ${i+1} 轮扫描`, { highlighted: [j, minimum], pointers: { [j]: 'j', [minimum]: 'min' }, label: `比较候选 ${j}` }));
      if (a[j] < a[minimum]) {
        minimum = j;
        add('minimum', `更新 minimum=${minimum}，还没有交换元素。`,
          state(3, `第 ${i+1} 轮扫描`, { highlighted: [minimum], pointers: { [minimum]: 'min' }, label: `更新最小值下标 ${minimum}` }));
      }
    }
    if (minimum !== i) {
      [a[i], a[minimum]] = [a[minimum], a[i]]; ++swaps;
      add('swap', `扫描结束，交换位置 ${i} 与 ${minimum}，本轮最小值归位。`,
        state(4, `第 ${i+1} 轮归位`, { highlighted: [i, minimum], settled: range(i+1), label: `交换 ${i} 与 ${minimum}` }));
    } else add('keep', `本轮最小值已在位置 ${i}，不必交换。`,
      state(5, `第 ${i+1} 轮归位`, { settled: range(i+1), label: `位置 ${i} 已正确` }));
  }
  i = n; j = n; minimum = n;
  add('done', `有序结果 ${a.join(' ')}；比较 ${comparisons}=n(n-1)/2 次，交换 ${swaps} 次。`,
    state(6, '演示完成', { settled: range(n) }));
  return steps;
}
export function insertionSteps(input) {
  const { steps, add } = recorder(input), a = [...input], n = a.length;
  let i = 0, j = -1, key = null, hole = null, comparisons = 0, writes = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase, values: a,
    variables: { i, j, key: key ?? '—', hole: hole ?? '—', comparisons, writes }, counters: [comparisons, writes],
    scene: { key, hole, prefix: i }, settled: range(i), ...extra });
  add('start', '第一个元素作为有序前缀。暂存 key 后，“·”表示空位，不是额外重复的数据。', state(0, '初始化'));
  for (i = 1; i < n; ++i) {
    key = a[i]; hole = i; j = i-1;
    add('lift', `暂存 a[${i}]=${key}，位置 ${i} 成为空位。`,
      state(1, `第 ${i} 次插入`, { highlighted: [i], label: `暂存 key=${key}` }));
    while (j >= 0) {
      ++comparisons;
      add('compare', `比较 a[${j}]=${a[j]} 与暂存的 key=${key}。相等时不右移。`,
        state(2, `第 ${i} 次插入`, { highlighted: [j], pointers: { [j]: 'j' }, label: `比较 ${a[j]} 与 key` }));
      if (a[j] <= key) break;
      a[hole] = a[j]; hole = j; --j; ++writes;
      add('shift', `将较大的元素右移一格，空位移到 ${hole}。key=${key} 仍在暂存卡片中。`,
        state(3, `第 ${i} 次插入`, { highlighted: [hole+1], label: `右移到 ${hole+1}` }));
    }
    const value = key, position = hole; a[hole] = key; hole = null; key = null; ++writes;
    add('insert', `将 key=${value} 放入位置 ${position}，前 ${i+1} 个元素有序。`,
      state(4, `第 ${i} 次归位`, { highlighted: [position], settled: range(i+1), label: `插入 key 到 ${position}` }));
  }
  i = n; j = -1;
  add('done', `有序结果 ${a.join(' ')}；使用严格 > 右移，保留相等记录的先后顺序。`,
    state(5, '演示完成', { settled: range(n) }));
  return steps;
}
export function quickSteps(input) {
  const { steps, add } = recorder(input), a = [...input], n = a.length, pending = [{ left: 0, right: n-1 }], settled = new Set();
  let left = 0, right = n-1, lt = 0, scan = 0, gt = n-1, pivot = null, comparisons = 0, swaps = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase, values: a, settled: [...settled],
    variables: { lo: left, hi: right, lt, i: scan, gt, pivot: pivot ?? '—', pending: pending.length }, counters: [comparisons, swaps],
    scene: { left, right, lt, scan, gt, pivot, pending }, ...extra });
  const exchange = (x, y) => { if (x !== y) { [a[x], a[y]] = [a[y], a[x]]; ++swaps; } };
  add('start', '三向分区：小于、等于、未知、大于。pivot 保存数值，不随原槽位交换而改变。', state(0, '初始化'));
  while (pending.length) {
    ({ left, right } = pending.pop()); lt = left; scan = left; gt = right; pivot = a[Math.floor((left+right)/2)];
    add('partition', `处理区间 [${left},${right}]，保存 pivot=${pivot}。`,
      state(1, `分区 [${left},${right}]`, { highlighted: [Math.floor((left+right)/2)], label: `选定 pivot=${pivot}` }));
    while (scan <= gt) {
      const value = a[scan]; ++comparisons;
      add('compare', `检查 a[${scan}]=${value} 与 pivot=${pivot}，未知区间为 [${scan},${gt}]。`,
        state(2, `分区 [${left},${right}]`, { highlighted: [scan], pointers: { [scan]: 'i' }, label: `分区比较位置 ${scan}` }));
      if (value < pivot) {
        const from = scan, to = lt; exchange(scan, lt); ++scan; ++lt;
        add('partition', `${value}<pivot，送入左段，lt 和 i 都推进。`,
          state(3, `分区 [${left},${right}]`, { highlighted: [...new Set([from, to])], label: '扩大小于段' }));
      } else if (value > pivot) {
        const from = scan, to = gt; exchange(scan, gt); --gt;
        add('partition', `${value}>pivot，送入右段，只缩小 gt；换入 a[i] 的值必须重新检查。`,
          state(4, `分区 [${left},${right}]`, { highlighted: [...new Set([from, to])], label: '扩大大于段，i 不动' }));
      } else {
        ++scan;
        add('partition', `${value}==pivot，只推进 i，扩展等值段。`,
          state(5, `分区 [${left},${right}]`, { highlighted: [scan-1], label: '扩大等值段' }));
      }
    }
    for (let id = lt; id <= gt; ++id) settled.add(id);
    const branches = [{ left, right: lt-1 }, { left: gt+1, right }].filter(part => part.left <= part.right);
    branches.sort((a,b) => (b.right-b.left) - (a.right-a.left)); pending.push(...branches);
    add('settle', `等值段 [${lt},${gt}] 已归位；只需继续左右两侧，任务栈优先取较小区间。`,
      state(6, '保存子问题', { label: `等值段 ${lt}～${gt} 归位` }));
  }
  add('done', `有序结果 ${a.join(' ')}；平均 O(n log n)，最坏仍可达 O(n²)，三向分区不保证稳定性。`,
    state(7, '演示完成', { settled: range(n) }));
  return steps;
}
export const sortingDemos = {
  ring_queue: { lesson: 'linear.circular_queue', inputLabel: '入队顺序', defaults: [3, 1, 4, 2, 5], generate: ringQueueSteps,
    counters: ['入队', '出队'], flow: '取模回绕，复用已出队的槽位', tip: 'front==rear 时，怎样区分空队列和满队列？',
    code: ['int front=0, rear=0, count=0;', 'if (count == capacity) /* FULL: no change */;', 'data[rear]=value; rear=(rear+1)%capacity; ++count;', 'value=data[front]; front=(front+1)%capacity; --count;', '/* EMPTY: count == 0; FULL: count == capacity */'],
    knowledge: { 约定: ['front 下次出队位置', 'rear 下次写入位置', 'count 区分空和满'], 操作: ['先检查空满', '下标按容量取模', 'peek 不移动指针', '复用不等于覆盖有效元素'], 应用: ['约瑟夫：前 m-1 人移到队尾', '删除第 m 人，直到为空'] } },
  sorting_overview: { lesson: 'sorting.overview', inputLabel: '对比数据', defaults: [3, 1, 3, 2], generate: overviewSteps,
    counters: ['插入比较', '选择比较'], flow: '有序、元素保留和稳定性分别检查', tip: '只有相同值的记录，才能观察它们的相对顺序。',
    code: ['/* tag each original record with an id */', '/* insertion: move only records > key */', '/* keep equal-key records in original order */', '/* selection: find the minimum record */', '/* distant exchange can reorder equal keys */', '/* ordered + same elements; stability is separate */'],
    knowledge: { 正确性: ['非降序', '保留元素和重复次数', '去重必须由题意要求'], 稳定性: ['同键记录原顺序不变', '插入的严格 > 保证稳定', '直接交换的选择排序不保证稳定'], 复杂度: ['简单排序通常 O(n²)', '快速排序平均 O(n log n)', '不等于软件计时结果'] } },
  selection_sort: { lesson: 'sorting.selection_sort', inputLabel: '初始数组', defaults: [3, 1, 4, 2], generate: selectionSteps,
    counters: ['比较', '交换'], flow: '扫描最小值，结束后才交换', tip: '更新 minimum 与交换元素是不同操作。',
    code: ['/* prefix [0,i) is sorted */', 'int minimum = i;', '/* compare a[j] with a[minimum] */', 'if (a[j] < a[minimum]) minimum = j;', '/* after scanning, exchange a[i], a[minimum] */', '/* if minimum==i, no exchange needed */', '/* n*(n-1)/2 comparisons; unstable in general */'],
    knowledge: { 一轮: ['维护最小值下标', '扫描完再交换', '有序前缀扩大一位'], 性质: ['固定 n(n-1)/2 次比较', '最多 n-1 次交换', '时间 O(n²)、额外空间 O(1)', '直接交换版不稳定'] } },
  insertion_sort: { lesson: 'sorting.insertion_sort', inputLabel: '初始数组', defaults: [3, 1, 4, 2], generate: insertionSteps,
    counters: ['比较', '写入'], flow: '暂存 key，右移大值，再填空位', tip: '先判断 j>=0 再读 a[j]；相等时不右移。',
    code: ['/* prefix before i is sorted */', 'int key=a[i], j=i-1; /* hold key */', '/* first check j>=0, then compare a[j]>key */', 'a[j+1]=a[j]; --j; /* shift into the hole */', 'a[j+1]=key; /* fill the hole */', '/* strict > gives stability; best O(n), worst O(n²) */'],
    knowledge: { 操作: ['暂存 key', '大于 key 的值右移', '填回空位', '有序前缀增加'], 边界: ['先检查 j>=0', '相等不右移', '空位值不算有效元素'], 应用: ['排序相邻绝对差', '逐项核对 1～n-1，不能只核对总和'] } },
  quick_sort: { lesson: 'sorting.quick_sort', inputLabel: '初始数组', defaults: [3, 1, 3, 2, 4, 2], generate: quickSteps,
    counters: ['比较', '交换'], flow: '三向分区，等值段归位后处理两侧', tip: '交换到右段后，为什么 i 不能直接加 1？',
    code: ['/* tasks: unprocessed intervals */', 'int pivot=a[left+(right-left)/2];', '/* scan while i<=gt */', '/* < pivot: exchange a[lt],a[i]; ++lt; ++i; */', '/* > pivot: exchange a[i],a[gt]; --gt; keep i; */', '/* == pivot: ++i; */', '/* equal segment done; process left and right */', '/* average O(n log n), worst O(n²), not stable */'],
    knowledge: { 分区: ['保存 pivot 数值', '小于 / 等于 / 未知 / 大于四区间', '大于分支不推进 i', '只继续等值段两侧'], 实现: ['小区间优先', '参考代码递归较小侧、循环较大侧', '调用栈可控制为 O(log n)'], 性质: ['平均 O(n log n)', '最坏 O(n²)', '不保证稳定', '三向分区适合重复值'] } },
};
