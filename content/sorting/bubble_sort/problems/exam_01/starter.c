#include <stdio.h>

static int a[100000];

void sort_numbers(int values[], int n) {
    /* TODO: Sort values in ascending order. */
    (void)values;
    (void)n;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) return 1;
    for (int i = 0; i < n; ++i)
        if (scanf("%d", &a[i]) != 1) return 1;
    sort_numbers(a, n);
    for (int i = 0; i < n; ++i)
        printf("%d%c", a[i], i + 1 == n ? '\n' : ' ');
    return 0;
}
