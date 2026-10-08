#include <stdio.h>

void bubble_sort(int a[], int n) {
    /* TODO: 比较相邻元素，必要时交换。 */
}

int main(void) {
    int n, a[1000];
    if (scanf("%d", &n) != 1 || n < 1 || n > 1000) return 1;
    for (int i = 0; i < n; ++i)
        if (scanf("%d", &a[i]) != 1) return 1;
    bubble_sort(a, n);
    for (int i = 0; i < n; ++i)
        printf("%d%c", a[i], i + 1 == n ? '\n' : ' ');
    return 0;
}
