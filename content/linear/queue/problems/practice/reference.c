#include <stdio.h>
#define MAX 6
typedef struct { int data[MAX], front, rear, capacity; } Queue;

void queueinit(Queue *Q, int capacity) {
    Q->front = Q->rear = 0; Q->capacity = capacity;
}
int isempty(const Queue *Q) { return Q->front == Q->rear; }
int size(const Queue *Q) { return Q->rear - Q->front; }
void compact(Queue *Q) {
    int step = Q->front;
    for (int i = Q->front; i < Q->rear; ++i) Q->data[i - step] = Q->data[i];
    Q->rear -= step; Q->front = 0;
}
int q_push(Queue *Q, int e) {
    if (size(Q) == Q->capacity) return 0;
    if (Q->rear == Q->capacity) compact(Q);
    Q->data[Q->rear++] = e;
    return 1;
}
int q_pop(Queue *Q, int *e) {
    if (isempty(Q)) return 0;
    *e = Q->data[Q->front++];
    return 1;
}
int front_value(const Queue *Q, int *e) {
    if (isempty(Q)) return 0;
    *e = Q->data[Q->front]; return 1;
}
void clear(Queue *Q) { Q->front = Q->rear = 0; }
void listElem(const Queue *Q) {
    if (isempty(Q)) { puts("EMPTY"); return; }
    for (int i = Q->front; i < Q->rear; ++i)
        printf("%d%c", Q->data[i], i + 1 == Q->rear ? '\n' : ' ');
}
int main(void) {
    int capacity, q, op, e;
    Queue Q;
    if (scanf("%d%d", &capacity, &q) != 2 || capacity < 1 || capacity > MAX || q < 1 || q > 16) return 1;
    queueinit(&Q, capacity);
    for (int i = 0; i < q; ++i) {
        if (scanf("%d", &op) != 1) return 1;
        if (op == 1) {
            if (scanf("%d", &e) != 1) return 1;
            puts(q_push(&Q, e) ? "OK" : "FULL");
        } else if (op == 2 || op == 3) {
            int found = op == 2 ? q_pop(&Q, &e) : front_value(&Q, &e);
            if (found) printf("%d\n", e); else puts("EMPTY");
        } else if (op == 4) printf("%d\n", size(&Q));
        else if (op == 5) listElem(&Q);
        else if (op == 6) { clear(&Q); puts("OK"); }
        else if (op == 7) printf("%d %d\n", Q.front, Q.rear);
        else return 1;
    }
    return 0;
}
