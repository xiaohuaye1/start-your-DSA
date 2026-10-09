#include <stdio.h>
void selection_sort(int a[], int n) {
    for (int i = 0; i + 1 < n; ++i) {
        int minimum = i;
        for (int j = i + 1; j < n; ++j) if (a[j] < a[minimum]) minimum = j;
        if (minimum != i) { int t = a[i]; a[i] = a[minimum]; a[minimum] = t; }
    }
}
int main(void) {
    int a[3];
    for (int i = 0; i < 3; ++i) if (scanf("%d", &a[i]) != 1) return 1;
    selection_sort(a, 3);
    printf("%d %d %d\n", a[0], a[1], a[2]); return 0;
}

