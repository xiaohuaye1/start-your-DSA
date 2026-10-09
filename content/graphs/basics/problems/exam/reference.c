#include <stdio.h>
static unsigned char adjacent[1001][1001];
void add_edge(int a,int b) { adjacent[a][b]=adjacent[b][a]=1; }
int main(void) {
    int n,m;if(scanf("%d%d",&n,&m)!=2 || n<1 || n>1000 || m<0 || m>100000)return 1;
    for(int i=0;i<m;++i){int a,b;if(scanf("%d%d",&a,&b)!=2 || a<1 || a>n || b<1 || b>n)return 1;add_edge(a,b);}
    for(int a=1;a<=n;++a){for(int b=1;b<=n;++b)printf("%d%c",adjacent[a][b],b==n?'\n':' ');}
    for(int a=1;a<=n;++a){
        int degree=0;for(int b=1;b<=n;++b)degree+=adjacent[a][b];
        printf("%d",degree);
        for(int b=1;b<=n;++b)if(adjacent[a][b])printf(" %d",b);
        putchar('\n');
    }
    return 0;
}

