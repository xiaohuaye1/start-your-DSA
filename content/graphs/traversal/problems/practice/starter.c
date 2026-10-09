#include <stdio.h>
static unsigned char adjacent[101][101],visited[101];static int n,printed;
void dfs(int node){ /* TODO: visit then recursively scan ascending neighbors. */ (void)node; }
int main(void) {
    int m;if(scanf("%d%d",&n,&m)!=2 || n<1 || n>100 || m<0 || m>10000)return 1;
    for(int i=0;i<m;++i){int a,b;if(scanf("%d%d",&a,&b)!=2 || a<1 || a>n || b<1 || b>n)return 1;adjacent[a][b]=1;}
    dfs(1);putchar('\n');return 0;
}

