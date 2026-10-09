#include <stdio.h>
int count_pairs(int n) {
    int count = 0;
    /* TODO: use two loops to count all (i, j) pairs. */
    (void)n;
    return count;
}
int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    printf("%d\n", count_pairs(n));
    return 0;
}

