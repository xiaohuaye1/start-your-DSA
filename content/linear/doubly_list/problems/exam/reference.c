#include <stdio.h>
static int previous[100001], next_node[100001], alive[100001];
void insert_student(int id, int k, int side) {
    int left = side == 0 ? previous[k] : k;
    int right = next_node[left];
    previous[id] = left; next_node[id] = right;
    next_node[left] = id;
    if (right) previous[right] = id;
    alive[id] = 1;
}
void remove_student(int id) {
    if (!alive[id]) return;
    int left = previous[id], right = next_node[id];
    next_node[left] = right;
    if (right) previous[right] = left;
    alive[id] = 0;
}
int main(void) {
    int n, m;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100000) return 1;
    next_node[0] = 1; alive[1] = 1;
    for (int id = 2; id <= n; ++id) {
        int k, side;
        if (scanf("%d%d", &k, &side) != 2 || k < 1 || k >= id || (side != 0 && side != 1)) return 1;
        insert_student(id, k, side);
    }
    if (scanf("%d", &m) != 1 || m < 0) return 1;
    for (int i = 0; i < m; ++i) {
        int id; if (scanf("%d", &id) != 1 || id < 1 || id > n) return 1;
        remove_student(id);
    }
    int first = 1;
    for (int id = next_node[0]; id != 0; id = next_node[id]) {
        if (!first) putchar(' ');
        printf("%d", id); first = 0;
    }
    putchar('\n'); return 0;
}

