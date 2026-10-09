#include <stdio.h>
void selection_sort(int a[], int n) { /* TODO: implement the algorithm. */ (void)a; (void)n; }
int main(void) {
    int n; static int a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    selection_sort(a, n);
    for (int i = 0; i < n; ++i) printf("%d%c", a[i], i+1 == n ? '\n' : ' ');
    return 0;
}

