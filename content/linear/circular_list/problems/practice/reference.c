#include <stdio.h>
typedef struct Node { int value; struct Node *next; } Node;
Node *advance_head(Node *head, int steps) {
    for (int i = 0; i < steps; ++i) head = head->next;
    return head;
}
int main(void) {
    int n, steps; Node nodes[100];
    if (scanf("%d%d", &n, &steps) != 2 || n < 1 || n > 100 || steps < 0 || steps > 100) return 1;
    for (int i = 0; i < n; ++i) {
        if (scanf("%d", &nodes[i].value) != 1) return 1;
        nodes[i].next = &nodes[(i+1)%n];
    }
    Node *p = advance_head(nodes, steps);
    for (int i = 0; i < n; ++i, p = p->next)
        printf("%d%c", p->value, i+1 == n ? '\n' : ' ');
    return 0;
}

