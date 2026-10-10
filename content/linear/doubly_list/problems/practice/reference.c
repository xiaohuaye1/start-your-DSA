#include <stdio.h>
#include <stdlib.h>
typedef struct Node { int data; struct Node *prev, *next; } Node;
typedef struct { Node *head; int length; } DoublyList;

int initList(DoublyList *L) {
    L->head = (Node *)malloc(sizeof(Node));
    if (!L->head) return 0;
    L->head->prev = L->head->next = L->head; L->length = 0;
    return 1;
}
Node *node_at(DoublyList *L, int position) {
    Node *p = L->head->next;
    for (int i = 1; i < position; ++i) p = p->next;
    return p;
}
int insert_at(DoublyList *L, int position, int e) {
    if (position < 1 || position > L->length + 1) return 0;
    Node *next = node_at(L, position);
    Node *node = (Node *)malloc(sizeof(Node));
    if (!node) return 0;
    node->data = e; node->prev = next->prev; node->next = next;
    next->prev->next = node; next->prev = node; ++L->length;
    return 1;
}
int delete_at(DoublyList *L, int position, int *e) {
    if (position < 1 || position > L->length) return 0;
    Node *node = node_at(L, position);
    *e = node->data;
    node->prev->next = node->next; node->next->prev = node->prev;
    free(node); --L->length;
    return 1;
}
void print_forward(const DoublyList *L) {
    if (!L->length) { puts("EMPTY"); return; }
    for (const Node *p = L->head->next; p != L->head; p = p->next)
        printf("%d%c", p->data, p->next == L->head ? '\n' : ' ');
}
void print_backward(const DoublyList *L) {
    if (!L->length) { puts("EMPTY"); return; }
    for (const Node *p = L->head->prev; p != L->head; p = p->prev)
        printf("%d%c", p->data, p->prev == L->head ? '\n' : ' ');
}
void reverse(DoublyList *L) {
    Node *p = L->head;
    do {
        Node *next = p->next;
        p->next = p->prev; p->prev = next; p = next;
    } while (p != L->head);
}
void release(DoublyList *L) {
    Node *p = L->head->next;
    while (p != L->head) { Node *next = p->next; free(p); p = next; }
    free(L->head); L->head = NULL; L->length = 0;
}
int main(void) {
    int n, q, op, position, e, ok = 1;
    DoublyList L;
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
        } else if (op == 3) print_forward(&L);
        else if (op == 4) print_backward(&L);
        else if (op == 5) reverse(&L);
        else if (op == 6) printf("%d\n", L.length);
        else ok = 0;
    }
    release(&L);
    return ok ? 0 : 1;
}
