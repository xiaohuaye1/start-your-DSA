#include <stdio.h>

void bubble_sort(int a[], int n) {
    for (int i = 0; i < n - 1; ++i) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; ++j) {
            if (a[j] > a[j + 1]) {
                int temporary = a[j];
                a[j] = a[j + 1];
                a[j + 1] = temporary;
                swapped = 1;
            }
        }
        if (!swapped) break;
    }
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
