"""Independent tiny-input checks; no outputs read from bundled C references."""
from functools import lru_cache
LESSONS = {'advanced.hash_table','advanced.greedy','advanced.dynamic_programming','comprehensive.training'}

def final_answer(lesson,stage,text):
    if lesson=='advanced.hash_table' and stage=='exam':
        n,*words=text.split(); assert int(n)==len(words)
        return str(len(set(words)))
    tokens=list(map(int,text.split()))
    if lesson=='advanced.hash_table':
        q=tokens[0]; assert len(tokens)==2*q+1
        counts={};out=[]
        for op,key in zip(tokens[1::2],tokens[2::2]):
            if op==1: counts[key]=counts.get(key,0)+1
            elif op==2: counts[key]=max(0,counts.get(key,0)-1)
            elif op==3: out.append(counts.get(key,0))
            else: raise AssertionError('Unknown operation')
        return '\n'.join(map(str,out))
    if lesson=='advanced.greedy':
        n=tokens[0]; intervals=list(zip(tokens[1::2],tokens[2::2])); assert n==len(intervals)
        best=0
        for mask in range(1<<n):
            chosen=sorted(intervals[i] for i in range(n) if mask>>i&1)
            if all(a[1]<=b[0] for a,b in zip(chosen,chosen[1:])):best=max(best,len(chosen))
        return str(best)
    if lesson=='advanced.dynamic_programming':
        capacity,n=tokens[:2] if stage=='exam' else tokens[1::-1]
        items=list(zip(tokens[2::2],tokens[3::2])); assert len(items)==n
        best=0
        for mask in range(1<<n):
            chosen=[items[i] for i in range(n) if mask>>i&1]
            if sum(w for w,v in chosen)<=capacity:best=max(best,sum(v for w,v in chosen))
        return str(best)
    assert tokens[0]==len(tokens)-1
    @lru_cache(None)
    def minimum(piles):
        if len(piles)<2:return 0
        return min(piles[i]+piles[j]+minimum(tuple(sorted([v for k,v in enumerate(piles) if k not in (i,j)]+[piles[i]+piles[j]])))
                   for i in range(len(piles)) for j in range(i+1,len(piles)))
    return str(minimum(tuple(sorted(tokens[1:]))))
