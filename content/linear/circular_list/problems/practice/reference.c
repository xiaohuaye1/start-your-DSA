#include <stdio.h>
#include <stdlib.h>
typedef struct Node { int data; struct Node *next; } Node;
typedef struct { Node *head; int length; } CircularList;

int initList(CircularList *L) {
    L->head = (Node *)malloc(sizeof(Node));
    if (!L->head) return 0;
    L->head->next = L->head; L->length = 0;
    return 1;
}
int insert_at(CircularList *L, int position, int e) {
    if (position < 1 || position > L->length + 1) return 0;
    Node *p = L->head;
    for (int i = 1; i < position; ++i) p = p->next;
    Node *node = (Node *)malloc(sizeof(Node));
    if (!node) return 0;
    node->data = e; node->next = p->next; p->next = node;
    ++L->length;
    return 1;
}
int delete_at(CircularList *L, int position, int *e) {
    if (position < 1 || position > L->length) return 0;
    Node *p = L->head;
    for (int i = 1; i < position; ++i) p = p->next;
    Node *node = p->next;
    *e = node->data; p->next = node->next; free(node);
    --L->length;
    return 1;
}
void rotate(CircularList *L, int k) {
    if (!L->length) return;
    k %= L->length;
    Node *tail = L->head;
    while (tail->next != L->head) tail = tail->next;
    for (int i = 0; i < k; ++i) {
        Node *first = L->head->next;
        L->head->next = first->next;
        tail->next = first; first->next = L->head; tail = first;
    }
}
void listNode(const CircularList *L) {
    if (!L->length) { puts("EMPTY"); return; }
    for (const Node *p = L->head->next; p != L->head; p = p->next)
        printf("%d%c", p->data, p->next == L->head ? '\n' : ' ');
}
void release(CircularList *L) {
    Node *p = L->head->next;
    while (p != L->head) { Node *next = p->next; free(p); p = next; }
    free(L->head); L->head = NULL; L->length = 0;
}
int main(void) {
    int n, q, op, position, e, ok = 1;
    CircularList L;
    if (!initList(&L)) return 1;
    if (scanf("%d%d", &n, &q) != 2 || n < 0 || n > 8 || q < 1 || q > 16) ok = 0;
    for (int i = 0; ok && i < n; ++i)
        if (scanf("%d", &e) != 1 || !insert_at(&L, L.length + 1, e)) ok = 0;
    for (int i = 0; ok && i < q; ++i) {
        if (scanf("%d", &op) != 1) { ok = 0; break; }
        if (op == 1) {
            if (scanf("%d%d", &position, &e) != 2) { ok = 0; break; }
            puts(insert_at(&L, position, e) ? "OK" : "INVALID");
        } else if (op == 2) {
            if (scanf("%d", &position) != 1) { ok = 0; break; }
            if (delete_at(&L, position, &e)) printf("%d\n", e); else puts("INVALID");
        } else if (op == 3) {
            if (scanf("%d", &e) != 1 || e < 0) { ok = 0; break; }
            rotate(&L, e);
        } else if (op == 4) listNode(&L);
        else if (op == 5) printf("%d\n", L.length);
        else ok = 0;
    }
    release(&L);
    return ok ? 0 : 1;
}
