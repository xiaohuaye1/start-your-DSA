#include <stdio.h>
int main(void) {
    int a[100], n = 0, value;
    while (scanf("%d", &value) == 1 && value != 0) {
        if (n >= 100) return 1;
        a[n++] = value;
    }
    /* TODO: output a[n-1] down to a[0], separated by spaces. */
    return 0;
}

