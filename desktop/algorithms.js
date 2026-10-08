export function bubbleSteps(input) {
  const a = [...input], n = a.length, settled = [];
  const steps = [];
  const add = (action, explanation, i = 0, j = 0, highlighted = []) => steps.push({
    values: [...a], settled: [...settled], highlighted, variables: { i, j, n }, action, explanation,
  });
  add('start', '从左到右比较相邻元素，把较大的元素逐步移向右侧。');
  for (let i = 0; i < n - 1; i++) {
    let changed = false;
    for (let j = 0; j < n - i - 1; j++) {
      add('compare', `比较 a[${j}] = ${a[j]} 与 a[${j + 1}] = ${a[j + 1]}。`, i, j, [j, j + 1]);
      if (a[j] > a[j + 1]) {
        const [left, right] = [a[j], a[j + 1]];
        [a[j], a[j + 1]] = [right, left];
        changed = true;
        add('swap', `${left} > ${right}，交换这两个元素。`, i, j, [j, j + 1]);
      } else add('keep', '这两个元素顺序正确，继续比较下一对。', i, j, [j, j + 1]);
    }
    settled.push(n - i - 1);
    add('settle', `第 ${i + 1} 轮结束，位置 ${n - i - 1} 已归位。`, i, n - i - 2);
    if (!changed) break;
  }
  settled.splice(0, settled.length, ...Array.from({ length: n }, (_, index) => index));
  add('done', '排序完成。绿色元素已全部归位。');
  return steps;
}

export function binarySteps(values, target) {
  if (values.some((value, i) => i && value < values[i - 1])) throw new Error('二分查找需要升序数组。');
  const steps = [], n = values.length;
  let left = 0, right = n - 1;
  const add = (action, explanation, highlighted = [], mid) => steps.push({ values: [...values],
    highlighted, settled: Array.from({ length: n }, (_, i) => i).filter(i => i < left || i > right),
    variables: { left, right, ...(mid === undefined ? {} : { mid }), target }, action, explanation });
  add('start', '在有序数组中，每次排除一半的候选区间。');
  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    add('compare', `检查中点 a[${mid}] = ${values[mid]}。`, [mid], mid);
    if (values[mid] === target) { add('done', `找到 ${target}，下标为 ${mid}。`, [mid], mid); return steps; }
    values[mid] < target ? left = mid + 1 : right = mid - 1;
    add('narrow', `缩小查找区间至 [${left}, ${right}]。`);
  }
  add('done', '候选区间为空，目标不存在。');
  return steps;
}

export function parseArray(text) {
  const parts = text.trim().split(/[\s,，]+/).filter(Boolean);
  if (!parts.length || parts.length > 16 || parts.some(value => !/^-?\d+$/.test(value)))
    throw new Error('请输入 1～16 个整数，用空格或逗号分隔。');
  const values = parts.map(Number);
  if (values.some(value => !Number.isSafeInteger(value) || Math.abs(value) > 99999))
    throw new Error('整数范围为 -99999～99999。');
  return values;
}
