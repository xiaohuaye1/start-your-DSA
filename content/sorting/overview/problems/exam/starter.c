#include <stdio.h>
void insertion_sort(int a[], int n) { /* TODO: implement the algorithm. */ (void)a; (void)n; }
int main(void) {
    int n, a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    insertion_sort(a, n);
    int count = 0;
    for (int i = 0; i < n; ++i) if (i == 0 || a[i] != a[i-1]) ++count;
    printf("%d\n", count);
    int first = 1;
    for (int i = 0; i < n; ++i) if (i == 0 || a[i] != a[i-1]) {
        if (!first) putchar(' ');
        printf("%d", a[i]); first = 0;
    }
    putchar('\n'); return 0;
}

