// Complete state snapshots for lessons 25-28; no execution of submitted C code.
const indices=n=>Array.from({length:n},(_,i)=>i);
function frames(input){const steps=[];return {steps,add(action,label,state){steps.push(structuredClone({values:[...input],highlighted:[],settled:[],variables:{},counters:[0,0],codeLine:0,scene:{},action,label,explanation:label,...state}));}};}
const normalized=(key,capacity)=>(key%capacity+capacity)%capacity;

export function hashTableSteps(input){
  const {steps,add}=frames(input),capacity=11,table=indices(capacity).map(()=>({state:'empty',key:null,count:0})),queries=[];
  let key=null,home=null,probe=null,probes=0,writes=0,processed=0,mode='准备';
  const state=(codeLine,phase)=>({codeLine,phase,variables:{mode,key:key??'—',home:home??'—',probe:probe??'—',processed},counters:[probes,writes],scene:{table,capacity,home,probe,key,queries}});
  add('start','容量 11：h(k)=((k%11)+11)%11，线性探测解决冲突。',state(0,'初始化'));
  const find=inserting=>{let deleted=null;for(let offset=0;offset<capacity;offset++){
    probe=(home+offset)%capacity;probes++;const slot=table[probe];
    add('probe',`检查槽位 ${probe}：${slot.state==='live'?'键 '+slot.key:slot.state==='deleted'?'DEL，继续探测':'EMPTY，从未占用'}。`,state(1,mode==='插入'?'插入与冲突':'查找探测'));
    if(slot.state==='live'&&slot.key===key)return probe;
    if(slot.state==='deleted'&&deleted===null)deleted=probe;
    if(slot.state==='empty')return inserting?deleted??probe:-1;
  }return inserting?deleted??-1:-1;};
  input.forEach((value,index)=>{key=value;home=normalized(key,capacity);probe=null;mode='插入';
    add('hash',`插入 ${key}，起始槽位 h=${home}。`,{...state(0,'计算哈希'),highlighted:[index]});
    const slot=find(true);if(table[slot].state==='live')table[slot].count++;else table[slot]={state:'live',key,count:1};writes++;processed++;
    add('store',`槽位 ${slot} 保存 ${key}，次数 ${table[slot].count}。`,{...state(2,'插入与冲突'),settled:indices(processed)});
  });
  const lookup=value=>{mode='查找';key=value;home=normalized(key,capacity);probe=null;
    add('hash',`查询 ${key}，从 h=${home} 开始。`,state(0,'查找探测'));const slot=find(false),count=slot<0?0:table[slot].count;
    queries.push({key,count});add('answer',`${key} 的次数是 ${count}；遇到 DEL 不能结束查找。`,state(3,'查询结果'));};
  lookup(input.at(-1));lookup(Math.max(...input)+1);
  mode='删除';key=input[0];home=normalized(key,capacity);probe=null;
  add('hash',`删除一份 ${key}。`,state(4,'删除与标记'));const slot=find(false);
  if(--table[slot].count===0)table[slot].state='deleted';writes++;
  add('delete',table[slot].state==='deleted'?`槽位 ${slot} 标记 DEL，不能改成 EMPTY。`:`只减次数，槽位 ${slot} 仍有效。`,state(4,'删除与标记'));
  lookup(input.length>1?input[1]:input[0]);mode='完成';probe=null;
  add('done','冲突、重复计数、未找到与删除标记已演示；哈希相同不代表键相同。',{...state(5,'演示完成'),settled:indices(input.length)});return steps;
}

export function greedySteps(input){
  const {steps,add}=frames(input),intervals=input.map((duration,id)=>({id,start:2*id,end:2*id+duration})),order=[...intervals].sort((a,b)=>a.end-b.end||a.start-b.start||a.id-b.id),selected=[],rejected=[];
  let active=null,scan=null,lastEnd=null,checks=0;
  const state=(codeLine,phase)=>({codeLine,phase,highlighted:active===null?[]:[active],settled:[...selected],variables:{scan:scan??'—',lastEnd:lastEnd??'—',chosen:selected.length,checks},counters:[checks,selected.length],scene:{intervals,order,selected,rejected,active,lastEnd}});
  add('start','输入表示时长；第 #i 个区间起点固定为 2*(i-1)，按结束时间选活动。',state(0,'初始化'));
  scan=0;add('sort','先按结束时间升序排列；不是按开始时间或最短时长排序。',state(1,'结束时间排序'));
  order.forEach((item,index)=>{active=item.id;scan=index;checks++;
    add('inspect',`检查 #${item.id+1}：[${item.start},${item.end})，已选结束时间 ${lastEnd??'无'}。`,state(2,'兼容性检查'));
    if(lastEnd===null||item.start>=lastEnd){selected.push(item.id);lastEnd=item.end;add('choose',`选择 #${item.id+1}；端点相接允许参加。`,state(3,'选择活动'));}
    else {rejected.push(item.id);add('reject',`跳过 #${item.id+1}，它与已经选择的活动重叠。`,state(4,'跳过重叠'));}
  });active=null;add('done',`最多选择 ${selected.length} 个活动：${selected.map(id=>'#'+(id+1)).join(' → ')}。`,state(5,'演示完成'));return steps;
}

export function knapsackSteps(input){
  const {steps,add}=frames(input),capacity=6,items=input.map((value,id)=>({id,weight:1+id%3,value})),dp=Array(capacity+1).fill(0),rows=[[...dp]],selected=[];
  let item=0,currentCapacity=null,from=null,before=[...dp],candidate=null,exclude=null,updates=0,improvements=0;
  const state=(codeLine,phase)=>({codeLine,phase,highlighted:item>0&&item<=input.length?[item-1]:[],settled:indices(Math.max(0,item-1)),variables:{item,capacity:currentCapacity??'—',best:dp[capacity],updates,improvements},counters:[updates,improvements],scene:{items,capacity,dp,before,currentCapacity,from,candidate,exclude,selected}});
  add('start','容量固定 6，重量循环 1/2/3，输入为物品价值；每件最多选一次。',state(0,'初始化'));
  for(const record of items){item=record.id+1;before=[...dp];currentCapacity=capacity;
    add('item',`处理 #${item}：重量 ${record.weight}，价值 ${record.value}。`,state(1,'处理物品'));
    for(let c=capacity;c>=record.weight;c--){currentCapacity=c;from=c-record.weight;exclude=dp[c];candidate=dp[from]+record.value;updates++;
      add('inspect',`容量 ${c}：不选 ${exclude}；选一次 ${before[from]}+${record.value}=${candidate}。`,state(2,'逆序更新容量'));
      if(candidate>dp[c]){dp[c]=candidate;improvements++;}
      add('update',`dp[${c}]=${dp[c]}。容量逆序，来源仍是处理此物品之前的状态。`,state(3,'逆序更新容量'));
    }
    rows.push([...dp]);currentCapacity=null;from=null;candidate=null;exclude=null;
    add('row','当前物品处理完；dp[c] 表示容量不超过 c 的最大价值。',state(4,'完成一行'));
  }
  let remaining=capacity;for(let i=items.length;i>0;i--)if(rows[i][remaining]>rows[i-1][remaining]){selected.unshift(i-1);remaining-=items[i-1].weight;}
  const result=state(5,'演示完成');result.highlighted=[];result.settled=indices(input.length);
  add('done',`最大价值 ${dp[capacity]}；选择 ${selected.map(id=>'#'+(id+1)).join('、')}，总重量 ${capacity-remaining}。`,result);return steps;
}

export function optimalMergeSteps(input){
  const {steps,add}=frames(input),heap=[],history=[];let pushes=0,pops=0,total=0,pair=[],active=[];
  const nodes=()=>heap.map((value,id)=>({id,value,left:2*id+1<heap.length?2*id+1:null,right:2*id+2<heap.length?2*id+2:null}));
  const state=(codeLine,phase)=>({codeLine,phase,variables:{size:heap.length,merges:history.length,total,pushes,pops},counters:[history.length,total],scene:{type:'tree',nodes:nodes(),root:heap.length?0:null,active,heap,history,pair,total}});
  add('start','把各堆重量放入小根堆；反复取最小两堆，合并后重新入堆。',state(0,'初始化'));
  const push=value=>{heap.push(value);pushes++;let p=heap.length-1;while(p>0){const parent=Math.floor((p-1)/2);if(heap[parent]<=heap[p])break;[heap[parent],heap[p]]=[heap[p],heap[parent]];p=parent;}active=[p];};
  const pop=()=>{const value=heap[0],last=heap.pop();pops++;if(heap.length)heap[0]=last;let p=0;for(;;){let best=p;for(const child of [2*p+1,2*p+2])if(child<heap.length&&heap[child]<heap[best])best=child;if(best===p)break;[heap[p],heap[best]]=[heap[best],heap[p]];p=best;}active=heap.length?[0]:[];return value;};
  input.forEach((value,index)=>{push(value);add('push',`加入重量 ${value}，小根堆大小 ${heap.length}。`,{...state(1,'建立优先队列'),highlighted:[index],settled:indices(index+1)});});
  while(heap.length>1){pair=[pop()];add('pop',`取出最小重量 ${pair[0]}。`,state(2,'取出最小两堆'));pair.push(pop());add('pop',`再取最小重量 ${pair[1]}。`,state(2,'取出最小两堆'));
    const cost=pair[0]+pair[1];total+=cost;history.push({left:pair[0],right:pair[1],cost,total});
    add('merge',`${pair[0]}+${pair[1]}=${cost}，累计代价 ${total}。`,state(3,'合并与累计'));push(cost);
    add('push',`新重量 ${cost} 重新入堆，不能只把原数组排序后相邻合并。`,state(4,'新堆重新入队'));
  }
  active=[];add('done',`剩余重量 ${heap[0]}；最小总代价 ${total}，完成 ${history.length} 次合并。`,{...state(5,'演示完成'),settled:indices(input.length)});return steps;
}

export const finalDemos={
  hash_table:{lesson:'advanced.hash_table',defaults:[1,12,23,2,13],generate:hashTableSteps,inputLabel:'整数键',counters:['探测','写入'],flow:'计算桶 → 冲突探测 → 比较键 → 查找 / 删除',tip:'删除后为什么需要 DEL，而不能直接置 EMPTY？',code:['int home=((key%M)+M)%M;','/* probe until equal key or never-used EMPTY */','/* store key; duplicates increment count */','/* query must compare full key */','/* erase one; count==0 marks DEL */','/* same hash does not imply equal key */'],knowledge:{哈希:['键映射到桶','线性探测解决冲突','同哈希仍比较键','重复值保存 count'],删除:['EMPTY 可停止查找','DEL 必须继续探测','插入可复用 DEL'],复杂度:['负载适当时预期 O(1)','最坏 O(n)','字符串真题用链式桶并核对原串']}},
  greedy_intervals:{lesson:'advanced.greedy',defaults:[5,1,4,2,1],positiveOnly:true,generate:greedySteps,inputLabel:'活动时长',counters:['检查','选中'],flow:'结束时间排序 → 兼容性判断 → 选择最早结束',tip:'先选最早结束的活动，如何用交换论证说明正确性？',code:['/* start=2*id, end=start+duration for this demo */','/* sort by end ascending */','if (start >= last_end) {','  ++answer; last_end=end;','} /* otherwise skip overlap */','/* O(n log n); proof by exchange */'],knowledge:{策略:['按结束时间升序','start >= lastEnd 可接续','只改变选择，不改变输入'],论证:['最早结束给后续留最多空间','交换最优解第一个区间','不是按最短时长或最早开始']}},
  knapsack_01:{lesson:'advanced.dynamic_programming',defaults:[6,10,12,3],positiveOnly:true,generate:knapsackSteps,inputLabel:'物品价值',counters:['状态','改善'],flow:'定义状态 → 逆序枚举容量 → 取选与不选的较大值',tip:'为什么 0/1 背包必须逆序更新一维 dp？',code:['/* dp[c]: best value with capacity <= c */','/* demo capacity=6; weights cycle 1,2,3 */','for (int c=capacity;c>=weight;--c) {','  dp[c]=max(dp[c],dp[c-weight]+value);','} /* source still belongs to previous item */','/* backtrack saved rows to show selected items */'],knowledge:{建模:['每件最多选一次','容量不超过上限','dp[c] 保存最大价值'],转移:['不选与选一次取 max','容量倒序防重复使用','时间 O(nC)、一维空间 O(C)'],边界:['初始 dp 为 0','不是恰好装满','完全背包的循环方向不同']}},
  optimal_merge:{lesson:'comprehensive.training',defaults:[4,2,5,1,3],positiveOnly:true,generate:optimalMergeSteps,inputLabel:'果堆重量',counters:['合并','代价'],flow:'输入 → 小根堆 → 取最小两项 → 合并回插 → 输出总代价',tip:'新合并的重量必须重新参与下一轮最小值选择。',code:['/* positive piles; read input once */','/* push each pile into min heap */','long long a=pop_min(), b=pop_min();','total += a+b;','push(a+b); /* while heap size > 1 */','/* n-1 merges; O(n log n) */'],knowledge:{综合流程:['数组输入与边界','小根堆优先队列','重复两次删除并回插','long long 累计代价'],正确性:['最轻两堆优先合并','新堆继续参与选择','重量守恒','一堆无需合并，代价 0']}},
};
