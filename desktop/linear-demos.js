// Logical node IDs are stable teaching labels, not actual memory addresses.
const indices = n => Array.from({ length: n }, (_, i) => i);
function recorder(input) {
  const steps = [];
  return { steps, add(action, explanation, state) {
    steps.push(structuredClone({ values: [...input], highlighted: [], settled: [],
      variables: {}, counters: [0, 0], codeLine: 0, scene: {}, action, explanation, ...state }));
  } };
}
function nodesFor(input, ring = false, double = false) {
  return input.map((value, i) => ({ id: i + 1, value, removed: false,
    next: i + 1 < input.length ? i + 2 : ring ? 1 : null,
    ...(double ? { prev: i ? i : null } : {}) }));
}
function orderFrom(nodes, head) {
  const order = [], seen = new Set();
  while (head !== null && !seen.has(head)) {
    const node = nodes.find(node => node.id === head);
    if (!node || node.removed) break;
    order.push(head); seen.add(head); head = node.next;
  }
  return order;
}
export function singlySteps(input) {
  const { steps, add } = recorder(input), nodes = nodesFor(input), n = input.length;
  let visits = 0, rewires = 0, current = null;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase,
    variables: { head: 1, current: current ?? 'NULL', visits, rewires }, counters: [visits, rewires],
    scene: { type: 'links', nodes, head: 1, current, order: orderFrom(nodes, 1) }, ...extra });
  add('start', 'head 指向节点 #1，末尾 next 为 NULL。节点编号不是实际地址。', state(0, '初始化'));
  for (const node of nodes) {
    current = node.id; ++visits;
    add('read', `访问 #${node.id}：value=${node.value}，next=${node.next === null ? 'NULL' : '#' + node.next}。`,
      state(1, '沿 next 遍历', { highlighted: [node.id - 1], pointers: { [node.id - 1]: 'current' }, label: `访问 #${node.id}` }));
  }
  const previous = nodes[Math.floor(n / 2)], node = { id: n + 1, value: 9, next: null, removed: false };
  nodes.push(node); current = node.id;
  add('allocate', `创建新节点 #${node.id}，暂未接入链表。`, state(2, '准备插入', { label: '创建新节点' }));
  node.next = previous.next; ++rewires;
  add('link', `先让新节点 next 指向原后继 ${node.next === null ? 'NULL' : '#' + node.next}。`,
    state(2, '保存原后继', { highlighted: [previous.id - 1], label: 'new->next = previous->next' }));
  previous.next = node.id; ++rewires;
  add('link', `再让 #${previous.id} 指向新节点 #${node.id}；插入完成，原后续节点不会丢失。`,
    state(3, '接入链表', { highlighted: [previous.id - 1], label: 'previous->next = new' }));
  previous.next = node.next; node.removed = true; ++rewires; current = previous.id;
  add('unlink', `删除新节点时，把前驱 next 改为新节点的后继。图中划去的节点已不在链上。`,
    state(4, '删除节点', { highlighted: [previous.id - 1], label: 'previous->next = new->next' }));
  current = null;
  add('done', `遍历 ${visits} 次，演示 ${rewires} 次指针更新。已知前驱时插入和删除为 O(1)，寻找前驱为 O(n)。`,
    state(5, '演示完成', { settled: indices(n) }));
  return steps;
}
export function circularSteps(input) {
  const { steps, add } = recorder(input), nodes = nodesFor(input, true), n = input.length, output = [], removed = [];
  let head = 1, current = 1, previous = n, count = 0, counts = 0, deletes = 0;
  const state = (codeLine, phase) => ({ codeLine, phase, settled: removed,
    highlighted: current === null ? [] : [current - 1], pointers: current === null ? {} : { [current - 1]: 'current' },
    variables: { head: head ?? 'NULL', current: current ?? 'NULL', previous: previous ?? 'NULL', count, remaining: n - deletes },
    counters: [counts, deletes], scene: { type: 'links', nodes, head, current, ring: true, order: orderFrom(nodes, head), output } });
  add('start', '尾节点 next 指回 head。固定每报到 2 删除当前节点，直到全部出圈。', state(0, '初始化'));
  while (deletes < n) {
    for (count = 1; count <= 2; ++count) {
      ++counts;
      add('count', `节点 #${current}（值 ${nodes[current - 1].value}）报数 ${count}。`,
        { ...state(1, '循环报数'), label: `#${current} 报数 ${count}` });
      if (count < 2) { previous = current; current = nodes[current - 1].next; }
    }
    count = 2;
    const target = nodes[current - 1], next = target.next;
    nodes[previous - 1].next = next; target.removed = true; output.push(target.value); removed.push(target.id - 1); ++deletes;
    if (deletes === n) head = current = previous = null;
    else { if (current === head) head = next; current = next; }
    add('unlink', `值 ${target.value} 出圈。前驱跳过该节点；下一次从后继重新报 1。`,
      { ...state(2, '删除并继续'), label: `删除 #${target.id}` });
    count = 0;
  }
  add('done', `出圈顺序：${output.join(' ')}。循环链表没有 NULL 尾标志，要按剩余数量停止。`, state(3, '演示完成'));
  return steps;
}
export function doublySteps(input) {
  const { steps, add } = recorder(input), nodes = nodesFor(input, false, true), n = input.length;
  let head = 1, tail = n, current = null, visits = 0, rewires = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase,
    highlighted: current === null ? [] : [current - 1], pointers: current === null ? {} : { [current - 1]: 'current' },
    variables: { head: head ?? 'NULL', tail: tail ?? 'NULL', current: current ?? 'NULL', visits, rewires },
    counters: [visits, rewires], scene: { type: 'links', nodes, head, current, double: true, order: orderFrom(nodes, head) }, ...extra });
  add('start', '每个节点同时保存 prev 和 next；可从 tail 沿 prev 反向访问。', state(0, '初始化'));
  for (let id = tail; id !== null; id = nodes[id - 1].prev) {
    current = id; ++visits;
    add('read', `反向访问 #${id}：prev=${nodes[id - 1].prev === null ? 'NULL' : '#' + nodes[id - 1].prev}。`,
      { ...state(1, '反向遍历'), label: `沿 prev 访问 #${id}` });
  }
  const target = nodes[Math.floor(n / 2)], left = target.prev, right = target.next; current = target.id;
  if (left === null) head = right; else nodes[left - 1].next = right;
  ++rewires;
  add('link', `先修复前驱的 next（无前驱则改 head）。反向连接尚未更新，不可中途当成删除完成。`,
    { ...state(2, '更新前向连接'), label: 'left->next = right / update head' });
  if (right === null) tail = left; else nodes[right - 1].prev = left;
  ++rewires;
  add('link', '再修复后继的 prev（无后继则改 tail），两侧连接现在一致。',
    { ...state(3, '更新反向连接'), label: 'right->prev = left / update tail' });
  target.removed = true; current = null;
  add('unlink', `节点 #${target.id} 已摘除，不再参与正向或反向遍历。`, state(4, '删除完成', { settled: [target.id - 1], label: `摘除 #${target.id}` }));
  add('done', '已知节点时删除为 O(1)。首尾删除要分别维护 head/tail；节点池示意不涉及释放内存。',
    state(5, '演示完成', { settled: indices(n) }));
  return steps;
}
export function operationStackSteps(input) {
  const { steps, add } = recorder(input), stack = [], output = [], n = input.length;
  let pushes = 0, pops = 0, peeks = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase,
    variables: { top: stack.length - 1, size: stack.length, pushes, pops, peeks }, counters: [pushes, pops],
    scene: { stack: stack.map(item => item.value), output }, ...extra });
  const pop = () => {
    const item = stack.pop(); output.push(item.value); ++pops;
    add('pop', `取出栈顶 ${item.value}，top 向下移动。`, state(3, '出栈', { highlighted: [item.index], label: `pop → ${item.value}` }));
  };
  add('start', '演示混合操作：入栈、只读取栈顶、出栈。top=-1 表示空栈。', state(0, '初始化'));
  input.forEach((value, index) => {
    stack.push({ value, index }); ++pushes;
    add('push', `${value} 入栈，top=${stack.length - 1}。`, state(1, '入栈', { highlighted: [index], label: `push ${value}` }));
    if (index % 2 === 1) {
      ++peeks;
      add('peek', `peek 得到 ${value}，但不移动 top，也不移除元素。`, state(2, '读取栈顶', { highlighted: [index], label: `peek → ${value}` }));
      pop();
    }
  });
  while (stack.length) pop();
  add('done', `输出顺序 ${output.join(' ')}；每次 pop 都取当时最后入栈的元素。空栈不能 pop/peek。`,
    state(4, '演示完成', { settled: indices(n) }));
  return steps;
}
export function operationQueueSteps(input) {
  const { steps, add } = recorder(input), slots = [], output = [], n = input.length;
  let front = 0, rear = 0;
  const state = (codeLine, phase, extra = {}) => ({ codeLine, phase,
    variables: { front, rear, size: rear - front, capacity: n }, counters: [rear, front],
    scene: { slots, front, rear, queue: slots.slice(front, rear), output }, ...extra });
  const dequeue = () => {
    const index = front, value = slots[front++]; output.push(value);
    add('dequeue', `从 front=${index} 取出 ${value}，front 前进到 ${front}。出队不移动其它元素。`,
      state(2, '出队', { highlighted: [index], label: `dequeue → ${value}` }));
  };
  add('start', '普通顺序队列：有效区间为 [front, rear)，两指针只向前移动，不循环复用槽位。', state(0, '初始化'));
  input.forEach((value, index) => {
    slots[rear++] = value;
    add('enqueue', `${value} 放入队尾槽位 ${rear - 1}，rear 前进到 ${rear}。`,
      state(1, '入队', { highlighted: [index], label: `enqueue ${value}` }));
    if (index % 2 === 1) dequeue();
  });
  while (front < rear) dequeue();
  add('done', `输出 ${output.join(' ')}，与进入顺序一致：FIFO。front==rear 时为空；循环复用留到循环队列一课。`,
    state(3, '演示完成', { settled: indices(n) }));
  return steps;
}
export const linearDemos = {
  singly_links: { lesson: 'linear.linked_list', inputLabel: '节点值', defaults: [3, 1, 4, 2], generate: singlySteps,
    counters: ['访问', '改链'], flow: '先保存后继，再接入新节点', tip: '把前驱指针先改掉，会丢失哪个节点的入口？',
    code: ['Node *p = head;', '/* visit p; then p = p->next */', 'node->next = previous->next;', 'previous->next = node;', 'previous->next = node->next;', '/* known predecessor: O(1) */'],
    knowledge: { 节点: ['struct Node / next', 'head 与 NULL', '编号不是内存地址'], 操作: ['沿 next 遍历 O(n)', '已知前驱时插入/删除 O(1)', '先保存后继，避免断链'] } },
  circular_links: { lesson: 'linear.circular_list', inputLabel: '节点值', defaults: [1, 2, 3, 4, 5], generate: circularSteps,
    counters: ['报数', '删除'], flow: '尾部回到 head，报 2 出圈', tip: '没有 NULL 尾标志，如何保证遍历会停止？',
    code: ['tail->next = head;', '/* count 1..2; advance current */', 'previous->next = current->next;', '/* stop when remaining == 0 */'],
    knowledge: { 结构: ['tail->next 指向 head', '一圈结束不等于 NULL'], 约瑟夫问题: ['数到 m 删除当前节点', '前驱跳过被删节点', '下一轮从后继报 1', '按剩余人数停止'] } },
  doubly_links: { lesson: 'linear.doubly_list', inputLabel: '节点值', defaults: [3, 1, 4, 2, 5], generate: doublySteps,
    counters: ['访问', '改链'], flow: '删除必须修复 next 与 prev 两个方向', tip: '只修改 next 后，反向遍历会遇到什么？',
    code: ['Node *p = tail;', '/* visit p; then p = p->prev */', '/* left->next = right; or head = right */', '/* right->prev = left; or tail = left */', '/* detach target */', '/* maintain both directions */'],
    knowledge: { 结构: ['prev 与 next', 'head / tail', '支持双向遍历'], 删除: ['修复两侧连接', '首尾节点要单独维护', '重复删除应忽略', '已知节点 O(1)'] } },
  stack_operations: { lesson: 'linear.stack', inputLabel: '入栈数据', defaults: [3, 1, 4, 2], generate: operationStackSteps,
    counters: ['入栈', '出栈'], flow: 'peek 不移除，pop 移除栈顶', tip: '括号匹配为什么必须检查每一步，而不只是总数相等？',
    code: ['int top = -1;', 'stack[++top] = value; /* push */', 'value = stack[top]; /* peek, nonempty */', 'value = stack[top--]; /* pop, nonempty */', '/* top == -1: empty */'],
    knowledge: { 操作: ['push 入栈', 'pop 出栈', 'peek 只读取', '空栈不能取栈顶'], 应用: ['后进先出 LIFO', '括号匹配与前缀合法性', '左右括号数量相等并不足够'] } },
  queue_operations: { lesson: 'linear.queue', inputLabel: '入队数据', defaults: [3, 1, 4, 2], generate: operationQueueSteps,
    counters: ['入队', '出队'], flow: '队尾入队，队首出队：FIFO', tip: '机器翻译题中，命中缓存不能把词移到队尾。',
    code: ['int front = 0, rear = 0;', 'queue[rear++] = value; /* enqueue */', 'value = queue[front++]; /* dequeue, nonempty */', '/* empty: front == rear; size: rear-front */'],
    knowledge: { 操作: ['队尾入，队首出', '[front,rear) 为有效区间', '先进先出 FIFO', '本节不循环复用槽位'], 应用: ['FIFO 缓存淘汰最早进入的词', '命中不重排，不是 LRU', '循环队列在下一节'] } },
};
