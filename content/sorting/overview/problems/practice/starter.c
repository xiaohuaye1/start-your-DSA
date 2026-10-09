#include <stdio.h>
int is_sorted(const int a[], int n) { /* TODO: inspect adjacent pairs without modifying a. */ (void)a; (void)n; return 0; }
int main(void) {
    int n, a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    printf("%d\n", is_sorted(a, n)); return 0;
}

