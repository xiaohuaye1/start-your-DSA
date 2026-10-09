#include <stdio.h>
int count_pairs(int n) {
    int count = 0;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) ++count;
    return count;
}
int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    printf("%d\n", count_pairs(n));
    return 0;
}

