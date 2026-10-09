#include <stdio.h>
int dictionary_lookups(const int words[], int n, int capacity) {
    int queue[1000], head = 0, tail = 0, misses = 0;
    for (int i = 0; i < n; ++i) {
        int found = 0;
        for (int j = head; j < tail; ++j) if (queue[j] == words[i]) { found = 1; break; }
        if (found) continue;
        ++misses;
        if (tail-head == capacity) ++head;
        queue[tail++] = words[i];
    }
    return misses;
}
int main(void) {
    int capacity, n, words[1000];
    if (scanf("%d%d", &capacity, &n) != 2 || capacity < 1 || capacity > 100 || n < 1 || n > 1000) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &words[i]) != 1) return 1;
    printf("%d\n", dictionary_lookups(words, n, capacity));
    return 0;
}

