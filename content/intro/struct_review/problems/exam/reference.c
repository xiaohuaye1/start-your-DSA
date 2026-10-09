#include <stdio.h>
typedef struct {
    int id, chinese, math, english, total;
} Student;
int before(Student a, Student b) {
    if (a.total != b.total) return a.total > b.total;
    if (a.chinese != b.chinese) return a.chinese > b.chinese;
    return a.id < b.id;
}
void rank_students(Student a[], int n) {
    for (int i = 0; i < n - 1; ++i)
        for (int j = 0; j < n - 1 - i; ++j)
            if (before(a[j + 1], a[j])) {
                Student temp = a[j]; a[j] = a[j + 1]; a[j + 1] = temp;
            }
}
int main(void) {
    int n; Student a[300];
    if (scanf("%d", &n) != 1 || n < 5 || n > 300) return 1;
    for (int i = 0; i < n; ++i) {
        a[i].id = i + 1;
        if (scanf("%d%d%d", &a[i].chinese, &a[i].math, &a[i].english) != 3) return 1;
        a[i].total = a[i].chinese + a[i].math + a[i].english;
    }
    rank_students(a, n);
    for (int i = 0; i < 5; ++i) printf("%d %d\n", a[i].id, a[i].total);
    return 0;
}

