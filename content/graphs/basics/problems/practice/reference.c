#include <stdio.h>
#define MAX 8
#define INF 1000000
typedef struct { int arc[MAX][MAX], vertex_num, edge_num; } MAT;

void initGraph(MAT *G, int n) {
    G->vertex_num = n; G->edge_num = 0;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) G->arc[i][j] = i == j ? 0 : INF;
}
void add_edge(MAT *G, int a, int b, int weight) {
    G->arc[a][b] = G->arc[b][a] = weight; ++G->edge_num;
}
int degree(const MAT *G, int vertex) {
    int count = 0;
    for (int j = 0; j < G->vertex_num; ++j)
        if (j != vertex && G->arc[vertex][j] != INF) ++count;
    return count;
}
int choose(const int distance[], const int found[], int n) {
    int position = -1, minimum = INF;
    for (int i = 0; i < n; ++i) {
        if (!found[i] && distance[i] < minimum) { minimum = distance[i]; position = i; }
    }
    return position;
}
void dijkstra(const MAT *G, int source, int distance[], int path[]) {
    int found[MAX] = {0};
    for (int i = 0; i < G->vertex_num; ++i) { distance[i] = INF; path[i] = -1; }
    distance[source] = 0;
    for (int i = 0; i < G->vertex_num; ++i) {
        int next = choose(distance, found, G->vertex_num);
        if (next == -1) break;
        found[next] = 1;
        for (int j = 0; j < G->vertex_num; ++j) {
            if (!found[j] && G->arc[next][j] != INF &&
                distance[next] + G->arc[next][j] < distance[j]) {
                distance[j] = distance[next] + G->arc[next][j]; path[j] = next;
            }
        }
    }
}
void print_distance(int value) {
    if (value == INF) printf("INF"); else printf("%d", value);
}
void print_path(int target, const int distance[], const int path[]) {
    if (distance[target] == INF) { puts("NO_PATH"); return; }
    int route[MAX], count = 0;
    for (int current = target; current != -1; current = path[current]) route[count++] = current + 1;
    for (int i = count - 1; i >= 0; --i) printf("%d%c", route[i], i ? ' ' : '\n');
}
void floyd(const MAT *G, int distance[MAX][MAX]) {
    int n = G->vertex_num;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) distance[i][j] = G->arc[i][j];
    for (int k = 0; k < n; ++k)
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j) {
                if (distance[i][k] != INF && distance[k][j] != INF &&
                    distance[i][k] + distance[k][j] < distance[i][j])
                    distance[i][j] = distance[i][k] + distance[k][j];
            }
}
int main(void) {
    int n, m, source, target, q;
    if (scanf("%d%d%d%d%d", &n, &m, &source, &target, &q) != 5 ||
        n < 1 || n > MAX || m < 0 || m > 12 || source < 1 || source > n ||
        target < 1 || target > n || q < 1 || q > 4) return 1;
    MAT G; initGraph(&G, n);
    for (int i = 0; i < m; ++i) {
        int a, b, weight;
        if (scanf("%d%d%d", &a, &b, &weight) != 3 || a < 1 || a > n || b < 1 || b > n || weight < 0) return 1;
        add_edge(&G, a - 1, b - 1, weight);
    }
    for (int i = 0; i < n; ++i) printf("%d%c", degree(&G, i), i + 1 == n ? '\n' : ' ');
    int distance[MAX], path[MAX], all[MAX][MAX];
    dijkstra(&G, source - 1, distance, path);
    for (int i = 0; i < n; ++i) { print_distance(distance[i]); putchar(i + 1 == n ? '\n' : ' '); }
    print_path(target - 1, distance, path);
    floyd(&G, all);
    for (int i = 0; i < q; ++i) {
        int a, b;
        if (scanf("%d%d", &a, &b) != 2 || a < 1 || a > n || b < 1 || b > n) return 1;
        print_distance(all[a - 1][b - 1]); putchar('\n');
    }
    return 0;
}
