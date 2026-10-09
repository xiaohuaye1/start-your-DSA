#include <stdio.h>
long long add_numbers(long long a, long long b) { /* TODO: return the sum. */ (void)a; (void)b; return 0; }
int main(void) {
    long long a, b;
    if (scanf("%lld%lld", &a, &b) != 2) return 1;
    printf("%lld\n", add_numbers(a, b));
    return 0;
}

