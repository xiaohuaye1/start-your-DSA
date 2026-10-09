#include <stdio.h>
#include <stdlib.h>
typedef struct Edge {int from,to;} Edge;
static Edge edges[1000000];
static int starts[100002],visited[100001],stack[100001],queue[100001],cursor[100001];
int compare_edges(const void *a,const void *b) {
    const Edge *x=(const Edge*)a,*y=(const Edge*)b;
    if(x->from!=y->from)return x->from<y->from?-1:1;
    return (x->to>y->to)-(x->to<y->to);
}

void dfs(int n){ /* TODO: iterative frames, ascending neighbors. */ (void)n; }
void bfs(int n){ /* TODO: mark on enqueue, then process FIFO. */ (void)n; }
int main(void) {
    int n,m;if(scanf("%d%d",&n,&m)!=2 || n<1 || n>100000 || m<0 || m>1000000)return 1;
    for(int i=0;i<m;++i){
        if(scanf("%d%d",&edges[i].from,&edges[i].to)!=2 || edges[i].from<1 || edges[i].from>n || edges[i].to<1 || edges[i].to>n)return 1;
        ++starts[edges[i].from+1];
    }
    for(int i=1;i<=n+1;++i)starts[i]+=starts[i-1];
    qsort(edges,m,sizeof(Edge),compare_edges);dfs(n);bfs(n);return 0;
}

