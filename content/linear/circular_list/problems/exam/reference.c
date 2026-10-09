#include <stdio.h>
typedef struct Node { int id; struct Node *next; } Node;
void eliminate_order(int n, int m) {
    Node nodes[100];
    for (int i = 0; i < n; ++i) {
        nodes[i].id = i+1; nodes[i].next = &nodes[(i+1)%n];
    }
    Node *current = nodes, *previous = &nodes[n-1];
    for (int remaining = n; remaining > 0; --remaining) {
        for (int count = 1; count < m; ++count) {
            previous = current; current = current->next;
        }
        printf("%d%c", current->id, remaining == 1 ? '\n' : ' ');
        previous->next = current->next;
        current = current->next;
    }
}
int main(void) {
    int n, m;
    if (scanf("%d%d", &n, &m) != 2 || n < 1 || n > 100 || m < 1 || m > 100) return 1;
    eliminate_order(n, m);
    return 0;
}

