#include <stdio.h>

long long minimum_swaps(int a[], int n) {
    long long count = 0;
    for (int i = 0; i < n - 1; ++i) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; ++j) {
            if (a[j] > a[j + 1]) {
                int t = a[j];
                a[j] = a[j + 1];
                a[j + 1] = t;
                ++count;
                swapped = 1;
            }
        }
        if (!swapped) break;
    }
    return count;
}

int main(void) {
    int n, a[2000];
    if (scanf("%d", &n) != 1 || n < 1 || n > 2000) return 1;
    for (int i = 0; i < n; ++i)
        if (scanf("%d", &a[i]) != 1) return 1;
    printf("%lld\n", minimum_swaps(a, n));
    return 0;
}
