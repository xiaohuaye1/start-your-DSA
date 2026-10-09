#include <stdio.h>
static unsigned char adjacent[101][101],visited[101];static int n,printed;
void dfs(int node) {
    visited[node]=1; if(printed++)putchar(' ');printf("%d",node);
    for(int next=1;next<=n;++next)if(adjacent[node][next]&&!visited[next])dfs(next);
}
int main(void) {
    int m;if(scanf("%d%d",&n,&m)!=2 || n<1 || n>100 || m<0 || m>10000)return 1;
    for(int i=0;i<m;++i){int a,b;if(scanf("%d%d",&a,&b)!=2 || a<1 || a>n || b<1 || b>n)return 1;adjacent[a][b]=1;}
    dfs(1);putchar('\n');return 0;
}

