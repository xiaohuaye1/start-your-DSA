#include <stdio.h>
int minimum_terms(int k) {
    int n = 0;
    double sum = 0.0;
    /* TODO: add terms until sum is strictly greater than k. */
    (void)sum; (void)k;
    return n;
}
int main(void) {
    int k;
    if (scanf("%d", &k) != 1 || k < 1 || k > 15) return 1;
    printf("%d\n", minimum_terms(k));
    return 0;
}

