"""Independent short-input answers, not obtained from reference C programs."""
import bisect
import heapq
from collections import deque

LESSONS = {'sorting.merge_sort', 'sorting.heap_sort', 'sorting.binary_search',
           'trees.binary_tree', 'trees.avl_tree', 'trees.heap', 'graphs.basics', 'graphs.traversal'}

def advanced_answer(lesson, stage, text):
    if lesson == 'trees.binary_tree' and stage == 'exam':
        lines = text.split()
        children = {row[0]: row[1:] for row in lines[1:]}
        def preorder(node):
            return '' if node == '*' else node + ''.join(preorder(child) for child in children[node])
        return preorder(lines[1][0])
    t = list(map(int, text.split()))
    n = t[0]
    if lesson in {'sorting.merge_sort', 'sorting.heap_sort'}:
        assert len(t) == n + 1
        return ' '.join(map(str, sorted(t[1:])))
    if lesson == 'sorting.binary_search':
        m, a = t[1], t[2:2+n]
        assert len(t) == 2+n+m and a == sorted(a)
        return ' '.join(str(a.index(x)+1 if x in a else -1) for x in t[2+n:])
    if lesson == 'trees.binary_tree':
        assert len(t) == 1+3*n
        children = {t[i]: t[i+1:i+3] for i in range(1,len(t),3)}
        def walk(node):
            return [] if node == 0 else [node]+sum((walk(child) for child in children[node]), [])
        return ' '.join(map(str, walk(t[1])))
    if lesson == 'trees.avl_tree' and stage == 'practice':
        # Recursive AVL implementation independent of the animation's path stack.
        def height(p): return p[3] if p else 0
        def update(p): p[3]=1+max(height(p[1]),height(p[2])); return p
        def rotate(p, side):
            q=p[side]; p[side]=q[3-side]; q[3-side]=update(p); return update(q)
        def insert(p,x):
            if not p: return [x,None,None,1]
            if x==p[0]: return p
            side=1 if x<p[0] else 2; p[side]=insert(p[side],x); update(p)
            balance=height(p[1])-height(p[2])
            if balance>1:
                if x>p[1][0]: p[1]=rotate(p[1],2)
                return rotate(p,1)
            if balance < -1:
                if x<p[2][0]: p[2]=rotate(p[2],1)
                return rotate(p,2)
            return p
        root=None
        for x in t[1:]: root=insert(root,x)
        return f'{root[0]} {height(root)}\n'+' '.join(map(str,sorted(t[1:])))
    if lesson == 'trees.avl_tree':
        a, out=[],[]
        assert len(t)==1+2*n
        for op,x in zip(t[1::2],t[2::2]):
            if op==1: bisect.insort(a,x)
            elif op==2: a.remove(x)
            elif op==3: out.append(bisect.bisect_left(a,x)+1)
            elif op==4: out.append(a[x-1])
            elif op==5: out.append(a[bisect.bisect_left(a,x)-1])
            elif op==6: out.append(a[bisect.bisect_right(a,x)])
        return '\n'.join(map(str,out))
    if lesson == 'trees.heap':
        heap,out=[],[]; cursor=1
        for _ in range(n):
            op=t[cursor]; cursor+=1
            if op==1: heapq.heappush(heap,t[cursor]); cursor+=1
            elif op==2: out.append(heap[0])
            else: heapq.heappop(heap)
        assert cursor==len(t)
        return '\n'.join(map(str,out))
    m=t[1]; adj=[set() for _ in range(n)]
    assert len(t)==2+2*m
    for a,b in zip(t[2::2],t[3::2]):
        adj[a-1].add(b-1)
        if lesson=='graphs.basics': adj[b-1].add(a-1)
    if lesson=='graphs.basics':
        if stage=='practice': return ' '.join(str(len(row)) for row in adj)
        rows=[' '.join(str(int(j in adj[i])) for j in range(n)) for i in range(n)]
        rows+=[' '.join(map(str,[len(row)]+[j+1 for j in sorted(row)])) for row in adj]
        return '\n'.join(rows)
    seen=set(); dfs=[]
    def walk(v):
        seen.add(v); dfs.append(v+1)
        for child in sorted(adj[v]):
            if child not in seen: walk(child)
    walk(0); seen={0}; queue=deque([0]); bfs=[]
    while queue:
        v=queue.popleft(); bfs.append(v+1)
        for child in sorted(adj[v]):
            if child not in seen: seen.add(child); queue.append(child)
    return ' '.join(map(str,dfs))+('' if stage=='practice' else '\n'+' '.join(map(str,bfs)))
