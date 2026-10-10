#include <stdio.h>
#include <stdlib.h>
typedef struct Node { int data; struct Node *next; } Node;

Node *initList(void) {
    Node *head = (Node *)malloc(sizeof(Node));
    if (head) { head->data = 0; head->next = NULL; }
    return head;
}
int length(const Node *L) {
    int count = 0;
    for (const Node *p = L->next; p; p = p->next) ++count;
    return count;
}
int insert_at(Node *L, int position, int e) {
    if (position < 1) return 0;
    Node *p = L;
    for (int i = 1; i < position && p; ++i) p = p->next;
    if (!p) return 0;
    Node *node = (Node *)malloc(sizeof(Node));
    if (!node) return 0;
    node->data = e; node->next = p->next; p->next = node;
    return 1;
}
int inserthead(Node *L, int e) { return insert_at(L, 1, e); }
int inserttail(Node *L, int e) { return insert_at(L, length(L) + 1, e); }
int delete_at(Node *L, int position, int *e) {
    if (position < 1) return 0;
    Node *p = L;
    for (int i = 1; i < position && p; ++i) p = p->next;
    if (!p || !p->next) return 0;
    Node *node = p->next;
    *e = node->data; p->next = node->next; free(node);
    return 1;
}
int search(const Node *L, int e) {
    int position = 1;
    for (const Node *p = L->next; p; p = p->next, ++position)
        if (p->data == e) return position;
    return 0;
}
void reverse(Node *L) {
    Node *first = NULL, *second = L->next;
    while (second) {
        Node *third = second->next;
        second->next = first; first = second; second = third;
    }
    L->next = first;
}
int countdown(const Node *L, int k, int *e) {
    if (k < 1) return 0;
    const Node *fast = L->next, *slow = L->next;
    for (int i = 0; i < k; ++i) {
        if (!fast) return 0;
        fast = fast->next;
    }
    while (fast) { fast = fast->next; slow = slow->next; }
    *e = slow->data;
    return 1;
}
int middle(const Node *L, int *e) {
    const Node *slow = L->next, *fast = L->next;
    if (!slow) return 0;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    *e = slow->data;
    return 1;
}
void listNode(const Node *L) {
    if (!L->next) { puts("EMPTY"); return; }
    for (const Node *p = L->next; p; p = p->next)
        printf("%d%c", p->data, p->next ? ' ' : '\n');
}
void release(Node *L) {
    Node *p = L->next;
    while (p) { Node *next = p->next; free(p); p = next; }
    free(L);
}
int main(void) {
    int n, q, op, e, position, ok = 1;
    Node *L = initList();
    if (!L) return 1;
    if (scanf("%d%d", &n, &q) != 2 || n < 0 || n > 8 || q < 1 || q > 16) ok = 0;
    for (int i = 0; ok && i < n; ++i)
        if (scanf("%d", &e) != 1 || !inserttail(L, e)) ok = 0;
    for (int i = 0; ok && i < q; ++i) {
        if (scanf("%d", &op) != 1) { ok = 0; break; }
        if (op == 1) {
            if (scanf("%d%d", &position, &e) != 2) { ok = 0; break; }
            puts(insert_at(L, position, e) ? "OK" : "INVALID");
        } else if (op == 2 || op == 7) {
            if (scanf("%d", &position) != 1) { ok = 0; break; }
            int found = op == 2 ? delete_at(L, position, &e) : countdown(L, position, &e);
            if (found) printf("%d\n", e); else puts("INVALID");
        } else if (op == 3 || op == 9 || op == 10) {
            if (scanf("%d", &e) != 1) { ok = 0; break; }
            if (op == 3) printf("%d\n", search(L, e));
            else puts((op == 9 ? inserthead(L, e) : inserttail(L, e)) ? "OK" : "INVALID");
        } else if (op == 4) reverse(L);
        else if (op == 5) listNode(L);
        else if (op == 6) printf("%d\n", length(L));
        else if (op == 8) { if (middle(L, &e)) printf("%d\n", e); else puts("EMPTY"); }
        else ok = 0;
    }
    release(L);
    return ok ? 0 : 1;
}
