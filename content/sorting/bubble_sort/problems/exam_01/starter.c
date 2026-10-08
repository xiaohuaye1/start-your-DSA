#include <stdio.h>

long long minimum_swaps(int a[], int n) {
    /* TODO: 统计相邻交换次数。 */
    return 0;
}

int main(void) {
    int n, a[2000];
    if (scanf("%d", &n) != 1 || n < 1 || n > 2000) return 1;
    for (int i = 0; i < n; ++i)
        if (scanf("%d", &a[i]) != 1) return 1;
    printf("%lld\n", minimum_swaps(a, n));
    return 0;
}
