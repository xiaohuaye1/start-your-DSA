#include <stdio.h>
static int children[101][2], printed;
void preorder(int node) {
    if (!node) return;
    if (printed++) putchar(' ');
    printf("%d",node); preorder(children[node][0]); preorder(children[node][1]);
}
int main(void) {
    int n; if (scanf("%d",&n)!=1 || n<1 || n>100) return 1;
    int root=0;
    for (int i=0; i<n; ++i) {
        int node,left,right;
        if (scanf("%d%d%d",&node,&left,&right)!=3 || node<1 || node>n || left<0 || left>n || right<0 || right>n) return 1;
        if (i==0) root=node;
        children[node][0]=left; children[node][1]=right;
    }
    preorder(root); putchar('\n'); return 0;
}

