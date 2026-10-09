#include <stdio.h>
void update_value(int a[], int n, int index, int value) {
    if (index >= 0 && index < n) a[index] = value;
}
int main(void) {
    int n, index, value, a[100];
    if (scanf("%d%d%d", &n, &index, &value) != 3 || n < 1 || n > 100 ||
        index < 0 || index >= n) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    update_value(a, n, index, value);
    for (int i = 0; i < n; ++i) printf("%d%c", a[i], i + 1 == n ? '\n' : ' ');
    return 0;
}

