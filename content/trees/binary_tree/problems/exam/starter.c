#include <stdio.h>
static int children[256][2];
void preorder(int node){ /* TODO: output node then traverse children. */ (void)node; }
int main(void) {
    int n,root=0; char row[4];
    if (scanf("%d",&n)!=1 || n<1 || n>26) return 1;
    for (int i=0; i<n; ++i) {
        if (scanf("%3s",row)!=1) return 1;
        int node=(unsigned char)row[0];
        if (i==0) root=node;
        children[node][0]=row[1]=='*'?0:(unsigned char)row[1];
        children[node][1]=row[2]=='*'?0:(unsigned char)row[2];
    }
    preorder(root); putchar('\n'); return 0;
}

