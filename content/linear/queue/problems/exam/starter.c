#include <stdio.h>
int dictionary_lookups(const int words[], int n, int capacity) {
    /* TODO: simulate a FIFO cache, without reordering hits. */
    (void)words; (void)n; (void)capacity;
    return 0;
}
int main(void) {
    int capacity, n, words[1000];
    if (scanf("%d%d", &capacity, &n) != 2 || capacity < 1 || capacity > 100 || n < 1 || n > 1000) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &words[i]) != 1) return 1;
    printf("%d\n", dictionary_lookups(words, n, capacity));
    return 0;
}

