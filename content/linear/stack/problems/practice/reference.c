#include <stdio.h>
#define MAX 6
typedef struct { int data[MAX], top, capacity; } Stack;

void initStack(Stack *s, int capacity) { s->top = -1; s->capacity = capacity; }
int isEmpty(const Stack *s) { return s->top == -1; }
int size(const Stack *s) { return s->top + 1; }
int push(Stack *s, int e) {
    if (size(s) == s->capacity) return 0;
    s->data[++s->top] = e; return 1;
}
int pop(Stack *s, int *e) {
    if (isEmpty(s)) return 0;
    *e = s->data[s->top--]; return 1;
}
int peek(const Stack *s, int *e) {
    if (isEmpty(s)) return 0;
    *e = s->data[s->top]; return 1;
}
void clear(Stack *s) { s->top = -1; }
void listElem(const Stack *s) {
    if (isEmpty(s)) { puts("EMPTY"); return; }
    for (int i = 0; i <= s->top; ++i)
        printf("%d%c", s->data[i], i == s->top ? '\n' : ' ');
}
int main(void) {
    int capacity, q, op, e;
    Stack s;
    if (scanf("%d%d", &capacity, &q) != 2 || capacity < 1 || capacity > MAX || q < 1 || q > 16) return 1;
    initStack(&s, capacity);
    for (int i = 0; i < q; ++i) {
        if (scanf("%d", &op) != 1) return 1;
        if (op == 1) {
            if (scanf("%d", &e) != 1) return 1;
            puts(push(&s, e) ? "OK" : "FULL");
        } else if (op == 2 || op == 3) {
            int found = op == 2 ? pop(&s, &e) : peek(&s, &e);
            if (found) printf("%d\n", e); else puts("EMPTY");
        } else if (op == 4) printf("%d\n", size(&s));
        else if (op == 5) { clear(&s); puts("OK"); }
        else if (op == 6) listElem(&s);
        else return 1;
    }
    return 0;
}
