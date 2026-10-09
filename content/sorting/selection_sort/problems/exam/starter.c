#include <stdio.h>
void selection_sort(int a[], int n) { /* TODO: implement the algorithm. */ (void)a; (void)n; }
int main(void) {
    int a[3];
    for (int i = 0; i < 3; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    selection_sort(a, 3);
    printf("%d %d %d\n", a[0], a[1], a[2]); return 0;
}

