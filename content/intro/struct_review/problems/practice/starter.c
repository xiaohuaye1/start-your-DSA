#include <stdio.h>
typedef struct {
    int id;
    int score;
} Student;
Student best_student(const Student a[], int n) {
    Student best = a[0];
    /* TODO: compare score first, then smaller id on a tie. */
    (void)n;
    return best;
}
int main(void) {
    int n; Student a[100];
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    for (int i = 0; i < n; ++i)
        if (scanf("%d%d", &a[i].id, &a[i].score) != 2) return 1;
    Student best = best_student(a, n);
    printf("%d %d\n", best.id, best.score);
    return 0;
}

