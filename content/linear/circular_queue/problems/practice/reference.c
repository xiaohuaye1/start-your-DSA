#include <stdio.h>
typedef struct Queue { int data[100], front, rear, count, capacity; } Queue;
int q_push(Queue *q, int value) {
    if (q->count == q->capacity) return 0;
    q->data[q->rear] = value;
    q->rear = (q->rear + 1) % q->capacity; ++q->count;
    return 1;
}
int q_pop(Queue *q, int *value) {
    if (!q->count) return 0;
    *value = q->data[q->front];
    q->front = (q->front + 1) % q->capacity; --q->count;
    return 1;
}
int q_peek(const Queue *q, int *value) {
    if (!q->count) return 0;
    *value = q->data[q->front]; return 1;
}
int main(void) {
    int capacity, operations;
    if (scanf("%d%d", &capacity, &operations) != 2 || capacity < 1 || capacity > 100 ||
        operations < 1 || operations > 100) return 1;
    Queue q = {{0}, 0, 0, 0, capacity};
    for (int i = 0; i < operations; ++i) {
        int op, value;
        if (scanf("%d", &op) != 1) return 1;
        if (op == 1) {
            if (scanf("%d", &value) != 1) return 1;
            if (!q_push(&q, value)) puts("FULL");
        } else if (op == 2 || op == 3) {
            int ok = op == 2 ? q_pop(&q, &value) : q_peek(&q, &value);
            if (ok) printf("%d\n", value); else puts("EMPTY");
        } else return 1;
    }
    return 0;
}

