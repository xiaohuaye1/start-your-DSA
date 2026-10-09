#include <stdio.h>
void heap_sort(int a[], int n) { /* TODO: build a max heap and move its root to the suffix. */ (void)a; (void)n; }
int main(void) {
    int n; static int a[100000], temporary[100000];
    if (scanf("%d",&n)!=1 || n<1 || n>100000) return 1;
    for (int i=0; i<n; ++i) if (scanf("%d",&a[i])!=1) return 1;
    heap_sort(a,n);
    for (int i=0; i<n; ++i) printf("%d%c",a[i],i+1==n?'\n':' ');
    return 0;
}

