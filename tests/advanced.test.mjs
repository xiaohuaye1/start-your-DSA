import test from 'node:test';
import assert from 'node:assert/strict';
import {learningSteps} from '../desktop/learning-demos.js';
import {advancedDemos} from '../desktop/advanced-demos.js';
const sorted=a=>[...a].sort((x,y)=>x-y);
const cases=[[1],[2,1],[3,1,2,4,5],[5,4,3,2,1],[1,3,2],[3,1,2],[1,2,3],[-2,0,-2,3,1],[2,2,1,3,1,4,0,-1]];
function treeCheck(scene, avl=false){
  const nodes=new Map(scene.nodes.map(n=>[n.id,n])),seen=new Set(),output=[];
  function walk(id){if(id===null)return 0;assert.ok(nodes.has(id));assert.ok(!seen.has(id));seen.add(id);const p=nodes.get(id),l=walk(p.left);output.push(...Array(p.count??1).fill(p.value));const r=walk(p.right);if(avl){assert.equal(p.height,Math.max(l,r)+1);assert.ok(Math.abs(l-r)<=1);}return Math.max(l,r)+1;}
  walk(scene.root);assert.equal(seen.size,nodes.size);return output;
}
function heapCheck(a,max=false){for(let i=1;i<a.length;i++)assert.ok(max?a[Math.floor((i-1)/2)]>=a[i]:a[Math.floor((i-1)/2)]<=a[i]);}

test('新增八节：每帧合法，输入不变，回退快照独立',()=>{
  for(const [source,demo] of Object.entries(advancedDemos))for(const input of cases){
    const before=[...input],steps=learningSteps(source,input);assert.deepEqual(input,before);
    assert.equal(steps[0].action,'start');assert.equal(steps.at(-1).action,'done');
    for(const s of steps){assert.ok(s.codeLine>=0&&s.codeLine<demo.code.length);for(const i of [...s.highlighted,...s.settled])assert.ok(i>=0&&i<input.length);if(s.scene.type==='tree')treeCheck(s.scene);}
    const first=structuredClone(steps[0]);steps.at(-1).scene.changed=true;assert.deepEqual(steps[0],first);
  }
});
test('归并保留同键编号，缓冲区阶段不覆盖输入；堆排序有效前缀与后缀',()=>{
  for(const input of cases){
    const merge=learningSteps('merge_sort',input),last=merge.at(-1);assert.deepEqual(last.values,sorted(input));
    assert.deepEqual(last.scene.ids, input.map((v,id)=>({v,id})).sort((a,b)=>a.v-b.v||a.id-b.id).map(p=>p.id));
    for(let i=1;i<merge.length;i++)if(merge[i].action==='copy')assert.deepEqual(merge[i].values,merge[i-1].values);
    const heap=learningSteps('heap_sort',input);assert.deepEqual(heap.at(-1).values,sorted(input));
    for(const s of heap){assert.deepEqual(sorted(s.values),sorted(input));if(['built','heap_ready'].includes(s.action))heapCheck(s.scene.heap,true);assert.deepEqual(s.scene.suffix,sorted(input).slice(s.values.length-s.scene.suffix.length));}
  }
});
test('二分重复值取首次编号，缺失返回 -1；三种树遍历',()=>{
  for(const input of cases){
    const steps=learningSteps('lower_bound',input),a=sorted(input);for(const s of steps)assert.ok(0<=s.scene.left&&s.scene.left<=s.scene.right&&s.scene.right<=a.length);
    for(const q of steps.at(-1).scene.answers)assert.equal(q.answer,a.includes(q.target)?a.indexOf(q.target)+1:-1);
    const b=learningSteps('binary_tree',input).at(-1),out={pre:[],in:[],post:[]};
    const visit=i=>{if(i>=input.length)return;out.pre.push(input[i]);visit(2*i+1);out.in.push(input[i]);visit(2*i+2);out.post.push(input[i]);};visit(0);
    assert.deepEqual(b.scene.outputs,out);assert.deepEqual(b.counters,[3*input.length,3*input.length]);
  }
});
test('AVL 四类旋转、重复键和负数：接回父节点，高度与平衡一致',()=>{
  const rotations=new Set();
  for(const input of cases){const steps=learningSteps('avl_tree',input);for(const s of steps){treeCheck(s.scene);if(s.action==='rotate')rotations.add(s.label);if(['inserted','done'].includes(s.action)){const output=treeCheck(s.scene,true);assert.deepEqual(output,sorted(input.slice(0,s.variables.inserted)));}}}
  assert.ok(rotations.size>=3);
});
test('动态小根堆：peek 不删除，每次 pop 输出当时最小值，元素不丢失',()=>{
  for(const input of cases){const steps=learningSteps('min_heap',input);for(let i=0;i<steps.length;i++){
    const s=steps[i];assert.deepEqual(sorted([...s.scene.heap,...s.scene.output]),sorted(input.slice(0,s.variables.pushes)));
    if(['heap_ready','peek'].includes(s.action))heapCheck(s.scene.heap);
    if(s.action==='peek')assert.deepEqual(s.scene.heap,steps[i-1].scene.heap);
    if(s.action==='pop')assert.equal(s.scene.output.at(-1),Math.min(...steps[i-1].scene.heap));
  }assert.deepEqual(steps.at(-1).counters,[input.length,input.length]);}
});
test('图矩阵对称、邻接关系与度数；有向 DFS/BFS 防环及不可达节点',()=>{
  for(const input of cases){
    for(const s of learningSteps('graph_basics',input)){const {matrix,degree,edges}=s.scene;for(let i=0;i<input.length;i++){assert.equal(matrix[i].reduce((a,b)=>a+b,0),degree[i]);for(let j=0;j<input.length;j++)assert.equal(matrix[i][j],matrix[j][i]);}assert.equal(degree.reduce((a,b)=>a+b,0),2*edges.length);}
    const steps=learningSteps('graph_traversal',input),s=steps.at(-1).scene,adj=input.map(()=>[]);s.edges.forEach(([a,b])=>adj[a].push(b));adj.forEach(row=>row.sort((a,b)=>a-b));
    const dfs=[],seen=new Set();function walk(id){seen.add(id);dfs.push(id+1);for(const next of adj[id])if(!seen.has(next))walk(next);}walk(0);
    const bfs=[],queue=[0];seen.clear();seen.add(0);while(queue.length){const id=queue.shift();bfs.push(id+1);for(const next of adj[id])if(!seen.has(next)){seen.add(next);queue.push(next);}}
    assert.deepEqual(s.output,{dfs,bfs});for(const f of steps){assert.equal(new Set(f.scene.queue).size,f.scene.queue.length);assert.equal(new Set(f.scene.output.dfs).size,f.scene.output.dfs.length);assert.equal(new Set(f.scene.output.bfs).size,f.scene.output.bfs.length);}
  }
});
