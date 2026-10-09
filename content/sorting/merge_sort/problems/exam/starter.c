#include <stdio.h>
void merge_sort(int a[], int temporary[], int left, int right) {
    /* TODO: recursively sort two half-open intervals and stably merge them. */
    (void)a; (void)temporary; (void)left; (void)right;
}
int main(void) {
    int n; static int a[100000], temporary[100000];
    if (scanf("%d",&n)!=1 || n<1 || n>100000) return 1;
    for (int i=0; i<n; ++i) if (scanf("%d",&a[i])!=1) return 1;
    merge_sort(a,temporary,0,n);
    for (int i=0; i<n; ++i) printf("%d%c",a[i],i+1==n?'\n':' ');
    return 0;
}

