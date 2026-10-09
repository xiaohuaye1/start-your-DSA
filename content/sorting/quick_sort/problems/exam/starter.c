#include <stdio.h>
void quick_sort(int a[], int left, int right) { /* TODO: implement the algorithm. */ (void)a; (void)left; (void)right; }
int main(void) {
    int n; static int a[100000];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    quick_sort(a, 0, n-1);
    for (int i = 0; i < n; ++i) printf("%d%c", a[i], i+1 == n ? '\n' : ' ');
    return 0;
}

