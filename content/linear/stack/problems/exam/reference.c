#include <stdio.h>
int main(void) {
    char stack[20]; int top = -1, valid = 1, c;
    while ((c = getchar()) != EOF && c != '@') {
        if (c == '(') {
            if (top+1 >= 20) valid = 0;
            else stack[++top] = '(';
        } else if (c == ')') {
            if (top < 0 || stack[top] != '(') valid = 0;
            else --top;
        }
    }
    puts(valid && top == -1 ? "YES" : "NO");
    return 0;
}

