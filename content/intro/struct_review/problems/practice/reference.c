#include <stdio.h>
#define MAX 20
typedef struct { int id, score; } Student;
typedef struct { Student data[MAX]; int length; } StudentList;

void initList(StudentList *L) { L->length = 0; }
int find(const StudentList *L, int id) {
    for (int i = 0; i < L->length; ++i)
        if (L->data[i].id == id) return i;
    return -1;
}
int append(StudentList *L, int id, int score) {
    if (find(L, id) != -1 || L->length == MAX) return 0;
    L->data[L->length].id = id;
    L->data[L->length].score = score;
    ++L->length;
    return 1;
}
int update(StudentList *L, int id, int score) {
    int position = find(L, id);
    if (position == -1) return 0;
    L->data[position].score = score;
    return 1;
}
int delete_at(StudentList *L, int id, int *score) {
    int position = find(L, id);
    if (position == -1) return 0;
    *score = L->data[position].score;
    for (int i = position; i + 1 < L->length; ++i)
        L->data[i] = L->data[i + 1];
    --L->length;
    return 1;
}
int best(const StudentList *L) {
    if (!L->length) return -1;
    int position = 0;
    for (int i = 1; i < L->length; ++i) {
        if (L->data[i].score > L->data[position].score ||
            (L->data[i].score == L->data[position].score &&
             L->data[i].id < L->data[position].id)) position = i;
    }
    return position;
}
int statistics(const StudentList *L) {
    int total = 0;
    for (int i = 0; i < L->length; ++i) total += L->data[i].score;
    return total;
}
int main(void) {
    int n, q, op, id, score;
    StudentList L;
    initList(&L);
    if (scanf("%d%d", &n, &q) != 2 || n < 0 || n > 8 || q < 1 || q > 16) return 1;
    for (int i = 0; i < n; ++i) {
        if (scanf("%d%d", &id, &score) != 2 || !append(&L, id, score)) return 1;
    }
    for (int i = 0; i < q; ++i) {
        if (scanf("%d", &op) != 1) return 1;
        if (op == 1 || op == 3) {
            if (scanf("%d%d", &id, &score) != 2) return 1;
            if (op == 1) puts(update(&L, id, score) ? "OK" : "NOT_FOUND");
            else puts(append(&L, id, score) ? "OK" : "EXISTS");
        } else if (op == 2) {
            if (scanf("%d", &id) != 1) return 1;
            if (delete_at(&L, id, &score)) printf("%d\n", score);
            else puts("NOT_FOUND");
        } else if (op == 4) {
            int position = best(&L);
            if (position == -1) puts("EMPTY");
            else printf("%d %d\n", L.data[position].id, L.data[position].score);
        } else if (op == 5) {
            printf("%d %d\n", L.length, statistics(&L));
        } else if (op == 6) {
            if (scanf("%d", &id) != 1) return 1;
            int position = find(&L, id);
            if (position == -1) puts("NOT_FOUND");
            else printf("%d\n", L.data[position].score);
        } else return 1;
    }
    return 0;
}
