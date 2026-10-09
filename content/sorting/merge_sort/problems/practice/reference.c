#include <stdio.h>
void merge_sort(int a[], int temporary[], int left, int right) {
    if (right-left <= 1) return;
    int middle = left+(right-left)/2;
    merge_sort(a, temporary, left, middle); merge_sort(a, temporary, middle, right);
    int i=left, j=middle, out=left;
    while (i<middle && j<right) temporary[out++] = a[i]<=a[j] ? a[i++] : a[j++];
    while (i<middle) temporary[out++]=a[i++];
    while (j<right) temporary[out++]=a[j++];
    for (i=left; i<right; ++i) a[i]=temporary[i];
}
int main(void) {
    int n; static int a[100], temporary[100];
    if (scanf("%d",&n)!=1 || n<1 || n>100) return 1;
    for (int i=0; i<n; ++i) if (scanf("%d",&a[i])!=1) return 1;
    merge_sort(a,temporary,0,n);
    for (int i=0; i<n; ++i) printf("%d%c",a[i],i+1==n?'\n':' ');
    return 0;
}

