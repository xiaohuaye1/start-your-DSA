#include <stdio.h>
#include <stdlib.h>

static int a[100000];

static int compare_ints(const void *left, const void *right) {
    int x = *(const int *)left;
    int y = *(const int *)right;
    return (x > y) - (x < y);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) return 1;
    for (int i = 0; i < n; ++i)
        if (scanf("%d", &a[i]) != 1) return 1;
    qsort(a, (size_t)n, sizeof(a[0]), compare_ints);
    for (int i = 0; i < n; ++i)
        printf("%d%c", a[i], i + 1 == n ? '\n' : ' ');
    return 0;
}
