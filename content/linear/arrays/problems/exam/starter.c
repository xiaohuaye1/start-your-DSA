#include <stdio.h>
void count_left(const int a[], int n, int result[]) {
    for (int i = 0; i < n; ++i) {
        result[i] = 0;
        /* TODO: count earlier values strictly smaller than a[i]. */
        (void)a;
    }
}
int main(void) {
    int n, a[100], result[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    count_left(a, n, result);
    for (int i = 0; i < n; ++i) printf("%d%c", result[i], i + 1 == n ? '\n' : ' ');
    return 0;
}

