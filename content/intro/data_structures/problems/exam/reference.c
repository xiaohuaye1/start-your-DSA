#include <stdio.h>
int main(void) {
    int a[100], n = 0, value;
    while (scanf("%d", &value) == 1 && value != 0) {
        if (n >= 100) return 1;
        a[n++] = value;
    }
    for (int i = n - 1; i >= 0; --i)
        printf("%d%c", a[i], i == 0 ? '\n' : ' ');
    return 0;
}

