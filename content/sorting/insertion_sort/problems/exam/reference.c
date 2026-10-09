#include <stdio.h>
#include <stdlib.h>
void insertion_sort(int a[], int n) {
    for (int i = 1; i < n; ++i) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) { a[j+1] = a[j]; --j; }
        a[j+1] = key;
    }
}
int main(void) {
    int n, a[1000], differences[1000];
    while (scanf("%d", &n) == 1) {
        if (n < 1 || n > 1000) return 1;
        for (int i = 0; i < n; ++i) if (scanf("%d", &a[i]) != 1) return 1;
        for (int i = 1; i < n; ++i) differences[i-1] = abs(a[i] - a[i-1]);
        insertion_sort(differences, n-1);
        int valid = 1;
        for (int i = 0; i + 1 < n; ++i) if (differences[i] != i+1) { valid = 0; break; }
        puts(valid ? "Jolly" : "Not jolly");
    }
    return 0;
}

