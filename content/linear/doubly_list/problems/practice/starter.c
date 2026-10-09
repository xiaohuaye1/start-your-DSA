#include <stdio.h>
typedef struct Node { int value; struct Node *prev, *next; } Node;
Node *remove_at(Node *head, int position) {
    /* TODO: find position, update both next and prev, and return the new head. */
    (void)position;
    return head;
}
int main(void) {
    int n, position; Node nodes[100];
    if (scanf("%d%d", &n, &position) != 2 || n < 2 || n > 100 || position < 1 || position > n) return 1;
    for (int i = 0; i < n; ++i) {
        if (scanf("%d", &nodes[i].value) != 1) return 1;
        nodes[i].prev = i > 0 ? &nodes[i-1] : NULL;
        nodes[i].next = i+1 < n ? &nodes[i+1] : NULL;
    }
    Node *head = remove_at(nodes, position), *tail = head;
    for (Node *p = head; p; p = p->next) {
        printf("%d%c", p->value, p->next ? ' ' : '\n'); tail = p;
    }
    for (Node *p = tail; p; p = p->prev)
        printf("%d%c", p->value, p->prev ? ' ' : '\n');
    return 0;
}

