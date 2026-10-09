#include <stdio.h>
void quick_sort(int a[], int left, int right) {
    /* Recurse only on the smaller partition; iterate over the larger one. */
    while (left < right) {
        int pivot = a[left + (right-left)/2], lt = left, i = left, gt = right;
        while (i <= gt) {
            if (a[i] < pivot) { int t = a[lt]; a[lt++] = a[i]; a[i++] = t; }
            else if (a[i] > pivot) { int t = a[i]; a[i] = a[gt]; a[gt--] = t; }
            else ++i;
        }
        if (lt-left < right-gt) {
            quick_sort(a, left, lt-1); left = gt+1;
        } else {
            quick_sort(a, gt+1, right); right = lt-1;
        }
    }
}
int main(void) {
    int n; static int a[100000];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    quick_sort(a, 0, n-1);
    for (int i = 0; i < n; ++i) printf("%d%c", a[i], i+1 == n ? '\n' : ' ');
    return 0;
}

