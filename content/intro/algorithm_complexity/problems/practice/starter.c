#include <stdio.h>
long long array_sum(const int a[], int n) {
    long long sum = 0;
    /* TODO: visit every element and update sum. */
    (void)a; (void)n;
    return sum;
}
int main(void) {
    int n, a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    printf("%lld\n", array_sum(a, n));
    return 0;
}

