#include <stdio.h>
void push_value(int data[], int *top, int value) { data[++(*top)] = value; }
int pop_value(const int data[], int *top) { return *top >= 0 ? data[(*top)--] : 0; }
int peek_value(const int data[], int top) { return top >= 0 ? data[top] : 0; }
int main(void) {
    int q, data[100], top = -1;
    if (scanf("%d", &q) != 1 || q < 1 || q > 100) return 1;
    for (int i = 0; i < q; ++i) {
        int op, value;
        if (scanf("%d", &op) != 1) return 1;
        if (op == 1) { if (scanf("%d", &value) != 1) return 1; push_value(data, &top, value); }
        else if (op == 2) printf("%d\n", pop_value(data, &top));
        else if (op == 3) printf("%d\n", peek_value(data, top));
        else return 1;
    }
    return 0;
}

