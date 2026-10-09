const range=n=>Array.from({length:n},(_,i)=>i);
function recorder(input){
  const steps=[];
  return {steps,add(action,explanation,state){steps.push(structuredClone({values:[...input],highlighted:[],settled:[],variables:{},counters:[0,0],codeLine:0,scene:{},action,explanation,...state}));}};
}
const completeNodes=a=>a.map((value,id)=>({id,value,left:2*id+1<a.length?2*id+1:null,right:2*id+2<a.length?2*id+2:null}));
export function mergeSteps(input){
  const {steps,add}=recorder(input), a=[...input], ids=range(a.length);
  let left=0,right=a.length,middle=null,i=0,j=0,buffer=[],bufferIds=[],comparisons=0,writes=0;
  const state=(codeLine,phase,extra={})=>({values:a,codeLine,phase,variables:{left,mid:middle??'—',right,i,j,buffer:buffer.length},counters:[comparisons,writes],scene:{left,right,middle,i,j,buffer,bufferIds,ids},...extra});
  add('start','半开区间递归拆分；缓冲区完整后再复制回原数组。',state(0,'初始化'));
  function sort(l,r){
    if(r-l<=1)return;
    left=l;right=r;middle=Math.floor((l+r)/2);buffer=[];bufferIds=[];i=l;j=middle;
    add('split',`把 [${l},${r}) 拆成 [${l},${middle}) 和 [${middle},${r})。`,state(1,'拆分区间',{label:`拆分 ${l}～${r}`}));
    const mid=middle;sort(l,mid);sort(mid,r);
    left=l;right=r;middle=mid;i=l;j=mid;buffer=[];bufferIds=[];
    while(i<mid||j<r){
      if(i<mid&&j<r){++comparisons;add('compare',`比较左侧 ${a[i]} 与右侧 ${a[j]}，相等时先取左侧。`,state(2,'合并缓冲区',{highlighted:[i,j],label:'比较两个有序子区间'}));}
      const chosen=j>=r||i<mid&&a[i]<=a[j]?i++:j++;
      buffer.push(a[chosen]);bufferIds.push(ids[chosen]);++writes;
      add('copy',`把 ${a[chosen]} 复制到辅助缓冲区，原数组此时不变。`,state(3,'合并缓冲区',{highlighted:[chosen],label:`缓冲区加入 ${a[chosen]}`}));
    }
    for(let k=0;k<buffer.length;++k){a[l+k]=buffer[k];ids[l+k]=bufferIds[k];++writes;}
    add('copyback',`完整缓冲区复制回 [${l},${r})，该区间现在有序。`,state(4,'复制回原区间',{highlighted:range(r-l).map(x=>x+l),label:`合并完成 ${l}～${r}`}));
  }
  sort(0,a.length);
  add('done',`结果 ${a.join(' ')}；稳定归并，时间 O(n log n)，辅助数组 O(n)。`,state(5,'演示完成',{settled:range(a.length)}));return steps;
}
export function heapSortSteps(input){
  const {steps,add}=recorder(input),a=[...input],n=a.length;let size=n,root=0,comparisons=0,swaps=0;
  const state=(codeLine,phase,active=[])=>({values:a,codeLine,phase,highlighted:active,settled:range(n).filter(i=>i>=size),variables:{heapSize:size,root,comparisons,swaps},counters:[comparisons,swaps],scene:{type:'tree',nodes:completeNodes(a.slice(0,size)),root:size?0:null,active,heap:a.slice(0,size),suffix:a.slice(size)}});
  add('start','0 基数组映射为完全二叉树，先从最后的非叶节点建大根堆。',state(0,'初始化'));
  const sift=start=>{
    root=start;
    for(;;){let best=root;
      for(const child of [root*2+1,root*2+2])if(child<size){++comparisons;add('compare',`比较孩子 ${a[child]} 与候选 ${a[best]}。`,{...state(1,'向下调整',[child,best]),label:'比较父子候选'});if(a[child]>a[best])best=child;}
      if(best===root)break;
      const from=root;[a[root],a[best]]=[a[best],a[root]];++swaps;root=best;
      add('swap','较大的孩子上移，继续修复下面的子树。',{...state(2,'向下调整',[from,best]),label:`下沉 ${from} → ${best}`});
    }
  };
  for(let p=Math.floor(n/2)-1;p>=0;--p)sift(p);
  add('built','大根堆已建立；堆内数组不必整体有序。',{...state(3,'完成建堆'),label:'大根堆已建立'});
  for(let end=n-1;end>0;--end){[a[0],a[end]]=[a[end],a[0]];++swaps;size=end;root=0;
    add('swap',`把最大值 ${a[end]} 放入有序后缀，有效堆大小缩到 ${size}。`,{...state(4,'取出最大值',[0,end]),label:`位置 ${end} 归位`});sift(0);
    add('heap_ready','有效前缀已恢复大根堆，后缀不再参与调整。',state(3,'堆序已恢复'));
  }
  size=0;add('done',`结果 ${a.join(' ')}；总时间 O(n log n)，原地、不保证稳定。`,state(5,'演示完成'));return steps;
}
export function lowerBoundSteps(input){
  const {steps,add}=recorder(input),a=[...input].sort((x,y)=>x-y),n=a.length,answers=[];
  let left=0,right=n,middle=null,target=null,comparisons=0,queries=0;
  const state=(codeLine,phase,extra={})=>({values:a,codeLine,phase,variables:{left,right,mid:middle??'—',target:target??'—',queries},counters:[comparisons,queries],scene:{left,right,middle,target,answers,original:input},...extra});
  add('start','演示先明确排序后的数据。搜索首个相等位置，输出 1 基编号；实操题目本身已保证有序。',state(0,'初始化'));
  for(const value of [a[Math.floor(n/2)],a[n-1]+1]){
    target=value;left=0;right=n;middle=null;
    add('query',`查询 target=${target}，区间 [0,${n})。`,state(1,'开始查询',{label:`查询 ${target}`}));
    while(left<right){middle=Math.floor((left+right)/2);++comparisons;
      add('compare',`mid=${middle}，a[mid]=${a[middle]}；等于也要继续向左收缩。`,state(2,'缩小区间',{highlighted:[middle],pointers:{[middle]:'mid'},label:`比较中点 ${middle}`}));
      if(a[middle]>=target)right=middle;else left=middle+1;
      add('narrow',`候选区间更新为 [${left},${right})。`,state(3,'缩小区间',{label:`保留 [${left},${right})`}));
    }
    const answer=left<n&&a[left]===target?left+1:-1;answers.push({target,answer});++queries;middle=null;
    add('answer',answer===-1?'候选不等于目标：未找到，输出 -1。':`第一次出现于下标 ${left}，题目编号为 ${answer}。`,state(4,'确认答案',{highlighted:answer===-1?[]:[left],label:`答案 ${answer}`}));
  }
  add('done','两次查询已完成；重复值取首次位置，未找到不能只返回插入位置。',state(5,'演示完成',{settled:range(n)}));return steps;
}
export function binaryTreeSteps(input){
  const {steps,add}=recorder(input),nodes=completeNodes(input),outputs={pre:[],in:[],post:[]},stack=[];
  let mode='—',current=null,visits=0,returns=0;
  const state=(codeLine,phase)=>({codeLine,phase,variables:{order:mode,node:current===null?'—':`#${current+1}`,depth:stack.length,visits},counters:[visits,returns],scene:{type:'tree',nodes,root:0,active:current===null?[]:[current],outputs,stack}});
  add('start','层序输入放入示例完全二叉树；编号与值分开，树不要求按值有序。',state(0,'初始化'));
  for(const [key,name] of [['pre','前序'],['in','中序'],['post','后序']]){
    mode=name;
    const walk=id=>{
      if(id===null)return;stack.push(id+1);current=id;
      add('enter',`进入节点 #${id+1}，递归栈为 ${stack.join(' → ')}。`,{...state(1,`${name}遍历`),highlighted:[id],label:`进入 #${id+1}`});
      const visit=()=>{current=id;outputs[key].push(nodes[id].value);++visits;add('visit',`输出 #${id+1} 的值 ${nodes[id].value}。`,{...state(2,`${name}遍历`),highlighted:[id],label:`${name}输出 ${nodes[id].value}`});};
      if(key==='pre')visit();walk(nodes[id].left);if(key==='in')visit();walk(nodes[id].right);if(key==='post')visit();
      stack.pop();current=id;++returns;add('return',`离开 #${id+1}，恢复上一层调用。`,{...state(3,`${name}遍历`),label:`返回上一层`});
    };walk(0);
  }
  current=null;add('done','前序根左右、中序左根右、后序左右根。普通二叉树的中序不一定有序。',state(4,'演示完成'));return steps;
}
export function avlSteps(input){
  const {steps,add}=recorder(input),nodes=[],byId=new Map();let root=null,current=null,key=null,inserted=0,comparisons=0,rotations=0;
  const node=id=>byId.get(id),height=id=>id===null?0:node(id).height;
  const update=id=>{const p=node(id);p.height=1+Math.max(height(p.left),height(p.right));};
  const bf=id=>height(node(id).left)-height(node(id).right);
  const state=(codeLine,phase)=>({codeLine,phase,settled:range(inserted),variables:{root:root===null?'—':`#${root+1}`,key:key??'—',inserted,height:height(root),rotations},counters:[comparisons,rotations],scene:{type:'tree',nodes,root,active:current===null?[]:[current],avl:true,updating:phase!=='完成插入'&&phase!=='演示完成'}});
  const rotate=(id,left)=>{const p=node(id),child=node(left?p.right:p.left);if(left){p.right=child.left;child.left=id;}else{p.left=child.right;child.right=id;}update(id);update(child.id);++rotations;return child.id;};
  add('start','AVL 插入后向上修复，旋转保持中序顺序；相同键增加 count。',state(0,'初始化'));
  input.forEach((value,index)=>{
    key=value;const path=[];let cursor=root,parent=null,side=null;
    while(cursor!==null){current=cursor;path.push(cursor);++comparisons;
      add('compare',`比较新键 ${value} 与 #${cursor+1} 的键 ${node(cursor).value}。`,{...state(1,'搜索插入位置'),highlighted:[index],label:`查找 ${value}`});
      if(value===node(cursor).value)break;parent=cursor;side=value<node(cursor).value?'left':'right';cursor=node(cursor)[side];
    }
    if(cursor!==null){++node(cursor).count;current=cursor;}
    else {const p={id:index,value,left:null,right:null,height:1,count:1};nodes.push(p);byId.set(index,p);if(parent===null)root=index;else node(parent)[side]=index;current=index;path.push(index);}
    add('link','接入节点或增加重复计数，开始回溯；上层缓存高度可能尚待更新。',{...state(2,'接入节点'),highlighted:[index],label:'接入并回溯'});
    for(let k=path.length-1;k>=0;--k){const old=path[k];current=old;update(old);let replacement=old;
      add('height',`更新 #${old+1} 高度 ${height(old)}，平衡因子 ${bf(old)}。`,{...state(3,'回溯更新高度'),label:`检查 #${old+1} 平衡`});
      if(bf(old)>1){if(bf(node(old).left)<0){node(old).left=rotate(node(old).left,true);add('rotate','LR：先左旋左子树。',{...state(4,'旋转修复'),label:'LR 第一步：左旋'});}replacement=rotate(old,false);}
      else if(bf(old)<-1){if(bf(node(old).right)>0){node(old).right=rotate(node(old).right,false);add('rotate','RL：先右旋右子树。',{...state(4,'旋转修复'),label:'RL 第一步：右旋'});}replacement=rotate(old,true);}
      if(replacement!==old){if(k===0)root=replacement;else{const p=node(path[k-1]);p[p.left===old?'left':'right']=replacement;}current=replacement;
        add('rotate','旋转后的子树重新接回父节点，继续更新祖先。',{...state(4,'旋转修复'),label:`新子树根 #${replacement+1}`});}
    }
    ++inserted;current=null;add('inserted',`插入 ${value} 完成，全树恢复 AVL 平衡。`,state(5,'完成插入'));
  });
  add('done','所有键已插入，中序保持有序，任意节点左右子树高度差不超过 1。',state(6,'演示完成'));return steps;
}
export function minHeapSteps(input){
  const {steps,add}=recorder(input),a=[],output=[];let pushes=0,pops=0,active=[];
  const state=(codeLine,phase)=>({codeLine,phase,settled:range(pushes),variables:{size:a.length,pushes,pops,top:a.length?a[0]:'—'},counters:[pushes,pops],scene:{type:'tree',nodes:completeNodes(a),root:a.length?0:null,active,heap:a,output}});
  add('start','动态小根堆：末尾插入上浮，取根后下沉；peek 不删除。',state(0,'初始化'));
  const remove=()=>{const value=a[0],last=a.pop();if(a.length)a[0]=last;output.push(value);++pops;active=a.length?[0]:[];
    add('pop',`取出当时最小值 ${value}，末尾替换根，可能需要下沉。`,{...state(3,'删除堆顶'),label:`取最小值 ${value}`});
    let p=0;for(;;){let best=p;for(const c of [2*p+1,2*p+2])if(c<a.length&&a[c]<a[best])best=c;if(best===p)break;[a[p],a[best]]=[a[best],a[p]];active=[p,best];p=best;
      add('heap_swap','交换较小的孩子，继续向下修复。',{...state(4,'向下调整'),label:'小值上移'});}
    active=[];add('heap_ready','已恢复小根堆性质。',state(5,'堆序已恢复'));
  };
  input.forEach((value,index)=>{a.push(value);++pushes;let p=a.length-1;active=[p];add('push',`${value} 先插入末尾。`,{...state(1,'插入与上浮'),highlighted:[index],label:`插入 ${value}`});
    while(p>0){const parent=Math.floor((p-1)/2);if(a[parent]<=a[p])break;[a[parent],a[p]]=[a[p],a[parent]];active=[parent,p];p=parent;add('heap_swap','新值更小，沿父节点上浮。',{...state(2,'插入与上浮'),label:'向上调整'});}
    active=[];add('heap_ready','插入修复完成，根是当前最小值。',state(5,'堆序已恢复'));
    if(index%2){active=[0];add('peek',`peek=${a[0]}，不改变 size。`,{...state(5,'查看最小值'),label:`peek ${a[0]}`});remove();}
  });while(a.length)remove();active=[];
  add('done',`动态取出顺序 ${output.join(' ')}。每次都是当时最小值，不等于预先排序所有未来输入。`,state(6,'演示完成'));return steps;
}
function teachingEdges(n,directed){
  if(!directed){const edges=range(n).slice(1).map(i=>[Math.floor((i-1)/2),i]);if(n>=3)edges.push([1,2]);return edges;}
  const candidate=[[0,1],[0,2],[1,3],[2,3],[3,1]];if(n>=6)candidate.push([2,4]);if(n>=7)candidate.push([4,5],[5,2]);return candidate.filter(([a,b])=>a<n&&b<n);
}
export function graphBasicsSteps(input){
  const {steps,add}=recorder(input),n=input.length,edges=[],planned=teachingEdges(n,false),matrix=range(n).map(()=>Array(n).fill(0)),degree=Array(n).fill(0);let active=[],inserted=0;
  const state=(codeLine,phase)=>({codeLine,phase,variables:{vertices:n,edges:inserted,degreeSum:degree.reduce((a,b)=>a+b,0)},counters:[inserted,inserted*2],scene:{type:'graph',nodes:input.map((value,id)=>({id,value})),edges,matrix,degree,active,directed:false}});
  add('start','输入只是顶点标签，教学模板自动生成无向边。矩阵与邻接表同步建立。',state(0,'初始化'));
  for(const [a,b] of planned){edges.push([a,b]);matrix[a][b]=matrix[b][a]=1;++degree[a];++degree[b];++inserted;active=[a,b];
    add('edge',`加入 #${a+1}—#${b+1}，写矩阵的两个对称位置，两端度数各加 1。`,{...state(1,'加入无向边'),highlighted:active,label:`无向边 ${a+1}—${b+1}`});}
  active=[];add('done',`共有 ${inserted} 条边，度数和 ${2*inserted}=2E；无向矩阵对称。`,{...state(3,'演示完成'),settled:range(n)});return steps;
}
export function graphTraversalSteps(input){
  const {steps,add}=recorder(input),n=input.length,edges=teachingEdges(n,true),adj=range(n).map(()=>[]),output={dfs:[],bfs:[]},stack=[],queue=[];edges.forEach(([a,b])=>adj[a].push(b));adj.forEach(a=>a.sort((x,y)=>x-y));
  let mode='准备',current=null,seen=Array(n).fill(false),visits=0,checks=0;
  const state=(codeLine,phase)=>({codeLine,phase,variables:{mode,current:current===null?'—':`#${current+1}`,visited:seen.filter(Boolean).length,container:mode==='DFS'?stack.length:queue.length},counters:[visits,checks],scene:{type:'graph',nodes:input.map((value,id)=>({id,value})),edges,active:current===null?[]:[current],directed:true,seen,output,stack,queue,mode}});
  add('start','固定教学有向图从 #1 出发，含环，也可能有不可达顶点。编号决定邻居顺序，标签不决定连接。',state(0,'初始化'));
  mode='DFS';
  const dfs=id=>{seen[id]=true;stack.push(id+1);current=id;output.dfs.push(id+1);++visits;
    add('visit',`DFS 首次进入 #${id+1}，路径栈 ${stack.join(' → ')}。`,{...state(1,'DFS 深入与回退'),highlighted:[id],label:`DFS #${id+1}`});
    for(const next of adj[id]){++checks;current=id;add('inspect',`检查边 #${id+1}→#${next+1}；${seen[next]?'已访问，跳过':'尚未访问，继续深入'}。`,{...state(2,'DFS 深入与回退'),label:`检查 ${id+1}→${next+1}`});if(!seen[next])dfs(next);}
    stack.pop();current=stack.length?stack.at(-1)-1:null;add('return','当前分支结束，回到上一层。',state(3,'DFS 深入与回退'));
  };dfs(0);
  mode='BFS';seen=Array(n).fill(false);seen[0]=true;queue.push(1);current=0;
  add('enqueue','重新设置 visited，#1 入队时立即标记，避免同一顶点重复排队。',state(4,'BFS 队列与分层'));
  while(queue.length){const id=queue.shift()-1;current=id;output.bfs.push(id+1);++visits;
    add('visit',`BFS 取出 #${id+1}，按编号检查邻居。`,{...state(5,'BFS 队列与分层'),highlighted:[id],label:`BFS #${id+1}`});
    for(const next of adj[id]){++checks;if(!seen[next]){seen[next]=true;queue.push(next+1);add('enqueue',`#${next+1} 入队并立即标记。`,{...state(4,'BFS 队列与分层'),label:`发现 #${next+1}`});}else add('skip',`#${next+1} 已发现，不重复入队。`,state(5,'BFS 队列与分层'));}
  }
  current=null;const unreachable=range(n).filter(i=>!seen[i]).map(i=>i+1);
  add('done',`DFS ${output.dfs.join(' ')}；BFS ${output.bfs.join(' ')}。${unreachable.length?'不可达节点 '+unreachable.join(' ')+' 不输出。':'本图全部可达。'}`,{...state(6,'演示完成'),settled:range(n).filter(i=>seen[i])});return steps;
}
const config=(lesson,defaults,generate,counters,flow,tip,code,knowledge,inputLabel='初始数据')=>({lesson,defaults,generate,counters,flow,tip,code,knowledge,inputLabel});
export const advancedDemos={
  merge_sort:config('sorting.merge_sort',[3,1,4,2,3],mergeSteps,['比较','写入'],'拆成有序子问题，再稳定合并','相等时先取左侧，为什么能保留同键顺序？',['/* half-open [left,right) */','/* recursively sort both halves */','/* compare a[i] <= a[j] */','temporary[out++] = chosen;','/* copy complete buffer back */','/* O(n log n), O(n) auxiliary space */'],{分治:['长度≤1 停止','拆分与合并','相等先取左侧'],性质:['稳定排序','时间 O(n log n)','辅助数组 O(n)']}),
  heap_sort:config('sorting.heap_sort',[3,1,4,2,5],heapSortSteps,['比较','交换'],'大根堆取最大值，缩小堆、修复前缀','有序后缀不能继续参与 sift_down。',['/* children: 2*i+1,2*i+2 */','/* select the largest parent/child */','/* swap and continue downward */','/* build a max heap bottom-up */','/* move root to suffix; reduce heap size */','/* total O(n log n), in-place, unstable */'],{过程:['O(n) 建堆','取最大值到后缀','有效堆大小递减'],区别:['堆序不是数组全序','静态大根堆排序','动态小根堆另见堆一课']}),
  lower_bound:config('sorting.binary_search',[1,2,2,4,6],lowerBoundSteps,['比较','查询'],'半开区间找首次出现，确认候选相等','找到一个相等值后，为什么还要向左找？',['int left=0,right=n;','/* queries: one present, one absent */','int mid=left+(right-left)/2;','/* >= target: right=mid; else left=mid+1 */','/* verify equal; output left+1 or -1 */','/* ordered input; O(log n) per query */'],{前提:['数组非降序','不能改动原查询编号'],边界:['[left,right) 半开区间','重复值返回首次位置','确认候选相等','题目输出 1 基编号']},'查询数据'),
  binary_tree:config('trees.binary_tree',[1,2,3,4,5],binaryTreeSteps,['访问','返回'],'根左右 / 左根右 / 左右根','普通二叉树的中序为什么不保证升序？',['/* teaching shape: complete binary tree */','/* enter a recursive frame */','/* output before/between/after children */','/* return to caller */','/* each traversal O(n), stack O(height) */'],{结构:['每节点至多两个孩子','编号与值分开','普通二叉树不等于搜索树'],遍历:['前序：根左右','中序：左根右','后序：左右根','空孩子停止']},'层序节点值'),
  avl_tree:config('trees.avl_tree',[3,1,2,4,5],avlSteps,['比较','旋转'],'搜索树插入，回溯更新高度并旋转','旋转改变树形，为什么不改变中序顺序？',['/* empty height=0, leaf height=1 */','/* BST search, duplicates increment count */','/* attach leaf and trace ancestor path */','/* update height; balance=leftHeight-rightHeight */','/* LL/LR/RR/RL rotations; reconnect parent */','/* insertion committed: |balance|<=1 */','/* sizes include duplicate counts */'],{平衡:['AVL 搜索树','高度差≤1','LL/LR/RR/RL','旋转保留中序顺序'],真题:['count 保存重复次数','size 支持排名和第 k 小','严格前驱 / 后继','删除只移除一份']},'插入键值'),
  min_heap:config('trees.heap',[4,2,5,1,3],minHeapSteps,['插入','删除'],'末尾插入上浮，取根后下沉','peek 不删除；动态取最小值不等于预先排序未来输入。',['/* min heap: parent <= children */','/* append new value */','/* sift upward */','/* replace root with last element */','/* sift downward */','/* heap restored; peek does not remove */','/* priority queue; O(log n) updates */'],{性质:['完全二叉树','小根堆根为最小值','堆序不等于全序'],操作:['插入上浮','删除根后下沉','查看 O(1)','重复最小值仅删一份']},'插入顺序'),
  graph_basics:config('graphs.basics',[1,2,3,4,5],graphBasicsSteps,['边','度数和'],'无向边双向存储，矩阵与邻接表对应','为什么无向图的度数和等于 2E？',['/* IDs distinguish vertices; labels are payload */','adjacent[u][v]=adjacent[v][u]=1;','/* enumerate neighbors in ascending ID order */','/* symmetric matrix; sum(degrees)=2E */'],{概念:['顶点与边','无向图 / 有向图','环与不连通'],存储:['矩阵 O(V²) 空间','邻接表 O(V+E) 空间','无向边存两个方向','邻居按编号输出']},'顶点标签'),
  graph_traversal:config('graphs.traversal',[1,2,3,4,5],graphTraversalSteps,['访问','查边'],'DFS 深入回退，BFS 队列分层','visited 为什么必须在 BFS 入队时就标记？',['/* directed teaching edges; start from ID 1 */','/* DFS: mark and enter frame */','/* scan ascending unvisited neighbors */','/* DFS: return to caller */','/* BFS: mark before enqueue */','/* pop front and inspect neighbors */','/* only reachable vertices are output */'],{前提:['有向边不自动补反向','从顶点 1 出发','只输出可达节点','邻居按编号升序'],方法:['DFS 栈 / 递归路径','BFS FIFO 队列','visited 防环和重复','矩阵遍历与邻接表复杂度不同']},'顶点标签'),
};
