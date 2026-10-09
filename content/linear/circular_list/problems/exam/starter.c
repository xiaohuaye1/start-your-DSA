#include <stdio.h>
typedef struct Node { int id; struct Node *next; } Node;
void eliminate_order(int n, int m) {
    /* TODO: build the circle and output each eliminated id. */
    (void)n; (void)m;
}
int main(void) {
    int n, m;
    if (scanf("%d%d", &n, &m) != 2 || n < 1 || n > 100 || m < 1 || m > 100) return 1;
    eliminate_order(n, m);
    return 0;
}

