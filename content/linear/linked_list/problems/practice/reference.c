#include <stdio.h>
typedef struct Node { int value; struct Node *next; } Node;
void insert_after(Node *previous, Node *node) {
    node->next = previous->next;
    previous->next = node;
}
int main(void) {
    int n, position, value; Node nodes[101];
    if (scanf("%d%d%d", &n, &position, &value) != 3 || n < 1 || n > 100 ||
        position < 1 || position > n) return 1;
    for (int i = 0; i < n; ++i) {
        if (scanf("%d", &nodes[i].value) != 1) return 1;
        nodes[i].next = i + 1 < n ? &nodes[i+1] : NULL;
    }
    nodes[n].value = value; nodes[n].next = NULL;
    insert_after(&nodes[position-1], &nodes[n]);
    for (Node *p = nodes; p != NULL; p = p->next)
        printf("%d%c", p->value, p->next ? ' ' : '\n');
    return 0;
}

