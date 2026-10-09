#include <stdio.h>
static int next_node[1000001];
void insert_after(int x, int y) {
    next_node[y] = next_node[x];
    next_node[x] = y;
}
void remove_after(int x) {
    if (next_node[x] != 0) next_node[x] = next_node[next_node[x]];
}
int main(void) {
    int q;
    if (scanf("%d", &q) != 1 || q < 1 || q > 100000) return 1;
    for (int i = 0; i < q; ++i) {
        int op, x, y;
        if (scanf("%d%d", &op, &x) != 2 || x < 1 || x > 1000000) return 1;
        if (op == 1) {
            if (scanf("%d", &y) != 1 || y < 1 || y > 1000000) return 1;
            insert_after(x, y);
        } else if (op == 2) printf("%d\n", next_node[x]);
        else if (op == 3) remove_after(x);
        else return 1;
    }
    return 0;
}

