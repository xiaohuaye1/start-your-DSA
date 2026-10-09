#include <stdio.h>
void reverse_values(int a[], int n) {
    for (int left = 0, right = n - 1; left < right; ++left, --right) {
        int temp = a[left]; a[left] = a[right]; a[right] = temp;
    }
}
int main(void) {
    int n, a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    reverse_values(a, n);
    for (int i = 0; i < n; ++i) printf("%d%c", a[i], i + 1 == n ? '\n' : ' ');
    return 0;
}

