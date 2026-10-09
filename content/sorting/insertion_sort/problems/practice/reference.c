#include <stdio.h>
void insertion_sort(int a[], int n) {
    for (int i = 1; i < n; ++i) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) { a[j+1] = a[j]; --j; }
        a[j+1] = key;
    }
}
int main(void) {
    int n; static int a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    insertion_sort(a, n);
    for (int i = 0; i < n; ++i) printf("%d%c", a[i], i+1 == n ? '\n' : ' ');
    return 0;
}

