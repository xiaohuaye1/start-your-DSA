import test from 'node:test';
import assert from 'node:assert/strict';
import { finalDemos } from '../desktop/final-demos.js';
import { learningSteps,parseLearningInput } from '../desktop/learning-demos.js';
const sort=a=>[...a].sort((a,b)=>a-b),sum=a=>a.reduce((a,b)=>a+b,0);
const cases=[[3],[3,3],[1,12,23,2,13],[5,1,4,2,1],[6,10,12,3],[2,4,1,3,5,2,6,4]];
function heap(a){for(let i=1;i<a.length;i++)assert.ok(a[Math.floor((i-1)/2)]<=a[i]);}

test('最后四节：每帧边界、独立快照、正整数约束',()=>{
  for(const [source,demo] of Object.entries(finalDemos))for(const input of cases){
    const old=[...input],frames=learningSteps(source,input);assert.deepEqual(input,old);assert.equal(frames[0].action,'start');assert.equal(frames.at(-1).action,'done');
    for(const f of frames){assert.deepEqual(f.values,input);assert.ok(f.codeLine>=0&&f.codeLine<demo.code.length);for(const id of [...f.highlighted,...f.settled])assert.ok(id>=0&&id<input.length);}
    const before=structuredClone(frames[0]);frames.at(-1).scene.changed=true;assert.deepEqual(frames[0],before);
  }
  for(const source of ['greedy_intervals','knapsack_01','optimal_merge']){
    assert.throws(()=>learningSteps(source,[0]),/正整数/);assert.throws(()=>parseLearningInput(source,'-1 2'),/正整数/);
  }
  assert.doesNotThrow(()=>learningSteps('hash_table',[-1,10,0]));
});
test('哈希：真实碰撞、负数归一化、重复计数、DEL 后继续查找',()=>{
  for(const input of [...cases,[-1,10,-1,0]]){
    const frames=learningSteps('hash_table',input),counts=new Map();let seenDeletion=false;
    for(const f of frames){
      if(f.action==='store')counts.set(f.scene.key,(counts.get(f.scene.key)||0)+1);
      if(f.action==='delete'){counts.set(input[0],counts.get(input[0])-1);seenDeletion=true;}
      if(f.action==='answer')assert.equal(f.scene.queries.at(-1).count,counts.get(f.scene.key)||0);
      const actual=new Map(f.scene.table.filter(s=>s.state==='live').map(s=>[s.key,s.count]));
      assert.deepEqual(actual,new Map([...counts].filter(([,v])=>v>0)));
      if(f.scene.home!==null)assert.equal(f.scene.home,((f.scene.key%11)+11)%11);
      assert.ok(f.scene.probe===null||f.scene.probe>=0&&f.scene.probe<11);
    }assert.equal(seenDeletion,true);
  }
  const frames=learningSteps('hash_table',[1,12,23]);const del=frames.findIndex(f=>f.action==='delete');
  assert.equal(frames[del].scene.table[1].state,'deleted');
  assert.ok(frames.slice(del+1).some(f=>f.action==='probe'&&f.scene.probe===1));
  assert.deepEqual(frames.at(-1).scene.queries.at(-1),{key:12,count:1});
});
test('贪心：可接续、排序不改原输入、结果与所有子集最优数一致',()=>{
  for(const input of cases){const f=learningSteps('greedy_intervals',input).at(-1),{intervals,selected,order}=f.scene;
    assert.deepEqual(order.map(x=>x.end),sort(intervals.map(x=>x.end)));
    const chosen=selected.map(id=>intervals[id]);for(let i=1;i<chosen.length;i++)assert.ok(chosen[i].start>=chosen[i-1].end);
    let best=0;for(let mask=0;mask<2**input.length;mask++){const seq=intervals.filter((_,i)=>mask>>i&1).sort((a,b)=>a.start-b.start);if(seq.every((x,i)=>i===0||seq[i-1].end<=x.start))best=Math.max(best,seq.length);}
    assert.equal(selected.length,best);
  }
});
test('0/1 背包：来源是上一物品状态，逆序容量，回溯不重复使用',()=>{
  for(const input of cases){const frames=learningSteps('knapsack_01',input);let oldItem=0,lastCapacity=7;
    for(const f of frames){if(f.action==='item'){oldItem=f.variables.item;lastCapacity=7;}
      if(f.action==='inspect'){assert.equal(f.variables.item,oldItem);assert.ok(f.scene.currentCapacity<lastCapacity);lastCapacity=f.scene.currentCapacity;
        assert.equal(f.scene.dp[f.scene.from],f.scene.before[f.scene.from]);assert.equal(f.scene.candidate,f.scene.before[f.scene.from]+input[oldItem-1]);}
    }
    const f=frames.at(-1),{items,selected,capacity}=f.scene;assert.equal(new Set(selected).size,selected.length);assert.ok(sum(selected.map(i=>items[i].weight))<=capacity);assert.equal(sum(selected.map(i=>items[i].value)),f.scene.dp[capacity]);
    for(let c=0;c<=capacity;c++){let best=0;for(let mask=0;mask<2**input.length;mask++){const chosen=items.filter((_,i)=>mask>>i&1);if(sum(chosen.map(x=>x.weight))<=c)best=Math.max(best,sum(chosen.map(x=>x.value)));}assert.equal(f.scene.dp[c],best);}
  }
});
test('最优合并：每帧堆序、两次取最小、重量守恒、回插与一堆边界',()=>{
  for(const input of cases){const frames=learningSteps('optimal_merge',input);for(let i=0;i<frames.length;i++){
    const f=frames[i],s=f.scene;heap(s.heap);assert.equal(s.nodes.length,s.heap.length);
    if(f.action==='pop')assert.equal(s.pair.at(-1),Math.min(...frames[i-1].scene.heap));
    if(f.action==='merge'){assert.equal(s.history.at(-1).cost,sum(s.pair));assert.equal(s.total,sum(s.history.map(r=>r.cost)));}
  }
  const s=frames.at(-1).scene;assert.equal(s.history.length,input.length-1);assert.deepEqual(s.heap,[sum(input)]);
  const a=sort(input);let expected=0;while(a.length>1){const value=a.shift()+a.shift();expected+=value;a.push(value);a.sort((a,b)=>a-b);}assert.equal(s.total,expected);
  }
  assert.equal(learningSteps('optimal_merge',[7]).at(-1).scene.total,0);
});
