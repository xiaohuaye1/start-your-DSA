#include <stdio.h>
int first_position(const int a[], int n, int target) {
    int left=0, right=n;
    while (left<right) {
        int middle=left+(right-left)/2;
        if (a[middle]>=target) right=middle;
        else left=middle+1;
    }
    return left<n && a[left]==target ? left+1 : -1;
}
int main(void) {
    int n,m; static int a[100];
    if (scanf("%d%d",&n,&m)!=2 || n<1 || n>100 || m<1 || m>100000) return 1;
    for (int i=0; i<n; ++i) if (scanf("%d",&a[i])!=1) return 1;
    for (int i=0; i<m; ++i) {
        int target; if (scanf("%d",&target)!=1) return 1;
        printf("%d%c",first_position(a,n,target),i+1==m?'\n':' ');
    }
    return 0;
}

