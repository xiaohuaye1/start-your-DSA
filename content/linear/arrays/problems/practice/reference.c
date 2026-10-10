#include <stdio.h>
#include <stdlib.h>
typedef struct { int *data, length, capacity; } SeqList;

int initList(SeqList *L) {
    L->length = 0; L->capacity = 4;
    L->data = (int *)malloc(sizeof(int) * L->capacity);
    return L->data != NULL;
}
int reserve(SeqList *L) {
    if (L->length < L->capacity) return 1;
    int capacity = L->capacity * 2;
    int *data = (int *)realloc(L->data, sizeof(int) * capacity);
    if (!data) return 0;
    L->data = data; L->capacity = capacity;
    return 1;
}
int insert_at(SeqList *L, int position, int e) {
    if (position < 1 || position > L->length + 1) return 0;
    if (!reserve(L)) return 0;
    for (int i = L->length; i >= position; --i) L->data[i] = L->data[i - 1];
    L->data[position - 1] = e;
    ++L->length;
    return 1;
}
int append(SeqList *L, int e) { return insert_at(L, L->length + 1, e); }
int delete_at(SeqList *L, int position, int *e) {
    if (position < 1 || position > L->length) return 0;
    *e = L->data[position - 1];
    for (int i = position; i < L->length; ++i) L->data[i - 1] = L->data[i];
    --L->length;
    return 1;
}
int search(const SeqList *L, int e) {
    for (int i = 0; i < L->length; ++i) if (L->data[i] == e) return i + 1;
    return 0;
}
void reverse(SeqList *L) {
    for (int i = 0, j = L->length - 1; i < j; ++i, --j) {
        int e = L->data[i]; L->data[i] = L->data[j]; L->data[j] = e;
    }
}
void listElem(const SeqList *L) {
    if (!L->length) { puts("EMPTY"); return; }
    for (int i = 0; i < L->length; ++i)
        printf("%d%c", L->data[i], i + 1 == L->length ? '\n' : ' ');
}
void release(SeqList *L) {
    free(L->data); L->data = NULL; L->length = L->capacity = 0;
}
int main(void) {
    int n, q, e, position, op, ok = 1;
    SeqList L;
    if (!initList(&L)) return 1;
    if (scanf("%d%d", &n, &q) != 2 || n < 0 || n > 8 || q < 1 || q > 16) ok = 0;
    for (int i = 0; ok && i < n; ++i)
        if (scanf("%d", &e) != 1 || !append(&L, e)) ok = 0;
    for (int i = 0; ok && i < q; ++i) {
        if (scanf("%d", &op) != 1) { ok = 0; break; }
        if (op == 1) {
            if (scanf("%d%d", &position, &e) != 2) { ok = 0; break; }
            puts(insert_at(&L, position, e) ? "OK" : "INVALID");
        } else if (op == 2) {
            if (scanf("%d", &position) != 1) { ok = 0; break; }
            if (delete_at(&L, position, &e)) printf("%d\n", e);
            else puts("INVALID");
        } else if (op == 3) {
            if (scanf("%d", &e) != 1) { ok = 0; break; }
            printf("%d\n", search(&L, e));
        } else if (op == 4) reverse(&L);
        else if (op == 5) listElem(&L);
        else if (op == 6) printf("%d\n", L.length);
        else ok = 0;
    }
    release(&L);
    return ok ? 0 : 1;
}
