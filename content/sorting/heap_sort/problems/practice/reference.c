#include <stdio.h>
void sift_down(int a[], int n, int root) {
    for (;;) {
        int best=root, left=root*2+1, right=left+1;
        if (left<n && a[left]>a[best]) best=left;
        if (right<n && a[right]>a[best]) best=right;
        if (best==root) break;
        int t=a[root]; a[root]=a[best]; a[best]=t; root=best;
    }
}
void heap_sort(int a[], int n) {
    for (int i=n/2-1; i>=0; --i) sift_down(a,n,i);
    for (int end=n-1; end>0; --end) {
        int t=a[0]; a[0]=a[end]; a[end]=t;
        sift_down(a,end,0);
    }
}
int main(void) {
    int n; static int a[100], temporary[100];
    if (scanf("%d",&n)!=1 || n<1 || n>100) return 1;
    for (int i=0; i<n; ++i) if (scanf("%d",&a[i])!=1) return 1;
    heap_sort(a,n);
    for (int i=0; i<n; ++i) printf("%d%c",a[i],i+1==n?'\n':' ');
    return 0;
}

