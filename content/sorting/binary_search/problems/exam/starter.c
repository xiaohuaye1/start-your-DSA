#include <stdio.h>
int first_position(const int a[], int n, int target) { /* TODO: find the first equal value; return 1-based position or -1. */ (void)a; (void)n; (void)target; return -1; }
int main(void) {
    int n,m; static int a[1000000];
    if (scanf("%d%d",&n,&m)!=2 || n<1 || n>1000000 || m<1 || m>100000) return 1;
    for (int i=0; i<n; ++i) if (scanf("%d",&a[i])!=1) return 1;
    for (int i=0; i<m; ++i) {
        int target; if (scanf("%d",&target)!=1) return 1;
        printf("%d%c",first_position(a,n,target),i+1==m?'\n':' ');
    }
    return 0;
}

