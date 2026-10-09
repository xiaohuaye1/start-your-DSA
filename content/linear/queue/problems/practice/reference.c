#include <stdio.h>
void enqueue(int data[], int *rear, int value) { data[(*rear)++] = value; }
int dequeue(const int data[], int *front, int rear) { return *front < rear ? data[(*front)++] : 0; }
int front_value(const int data[], int front, int rear) { return front < rear ? data[front] : 0; }
int main(void) {
    int q, data[100], front = 0, rear = 0;
    if (scanf("%d", &q) != 1 || q < 1 || q > 100) return 1;
    for (int i = 0; i < q; ++i) {
        int op, value;
        if (scanf("%d", &op) != 1) return 1;
        if (op == 1) { if (scanf("%d", &value) != 1) return 1; enqueue(data, &rear, value); }
        else if (op == 2) printf("%d\n", dequeue(data, &front, rear));
        else if (op == 3) printf("%d\n", front_value(data, front, rear));
        else return 1;
    }
    return 0;
}

