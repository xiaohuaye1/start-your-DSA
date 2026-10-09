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
void eliminate_order(int n, int m) {
    Queue q = {{0}, 0, 0, 0, n};
    for (int i = 1; i <= n; ++i) q_push(&q, i);
    for (int remaining = n; remaining; --remaining) {
        int value;
        for (int count = 1; count < m; ++count) {
            q_pop(&q, &value); q_push(&q, value);
        }
        q_pop(&q, &value);
        printf("%d%c", value, remaining == 1 ? '\n' : ' ');
    }
}
int main(void) {
    int n, m;
    if (scanf("%d%d", &n, &m) != 2 || n < 1 || n > 100 || m < 1 || m > 100) return 1;
    eliminate_order(n, m); return 0;
}

