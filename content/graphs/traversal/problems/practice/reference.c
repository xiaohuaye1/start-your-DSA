#include <stdio.h>
#define MAX 8
typedef struct { int arc[MAX][MAX], vertex_num, edge_num; } MAT;
typedef struct { int data[MAX], front, rear; } Queue;

void queueinit(Queue *Q) { Q->front = Q->rear = 0; }
void input(Queue *Q, int e) { Q->data[Q->rear++] = e; }
int output(Queue *Q) { return Q->data[Q->front++]; }
int isempty(const Queue *Q) { return Q->front == Q->rear; }
void initGraph(MAT *G, int n) {
    G->vertex_num = n; G->edge_num = 0;
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) G->arc[i][j] = 0;
}
void add_edge(MAT *G, int a, int b) {
    G->arc[a][b] = G->arc[b][a] = 1; ++G->edge_num;
}
void dfs(const MAT *G, int vertex, int visited[], int order[], int *count) {
    visited[vertex] = 1; order[(*count)++] = vertex + 1;
    for (int j = 0; j < G->vertex_num; ++j)
        if (G->arc[vertex][j] && !visited[j]) dfs(G, j, visited, order, count);
}
void bfs_component(const MAT *G, int root, int visited[], int order[], int *count,
                   int distance[], int record_distance) {
    Queue Q; queueinit(&Q); input(&Q, root); visited[root] = 1;
    if (record_distance) distance[root] = 0;
    while (!isempty(&Q)) {
        int vertex = output(&Q); order[(*count)++] = vertex + 1;
        for (int j = 0; j < G->vertex_num; ++j) {
            if (G->arc[vertex][j] && !visited[j]) {
                visited[j] = 1; input(&Q, j);
                if (record_distance) distance[j] = distance[vertex] + 1;
            }
        }
    }
}
void print_array(const int values[], int n) {
    for (int i = 0; i < n; ++i) printf("%d%c", values[i], i + 1 == n ? '\n' : ' ');
}
void traverse_all(const MAT *G, int source) {
    int visited[MAX] = {0}, order[MAX], count = 0, distance[MAX];
    dfs(G, source, visited, order, &count);
    for (int i = 0; i < G->vertex_num; ++i)
        if (!visited[i]) dfs(G, i, visited, order, &count);
    print_array(order, count);
    for (int i = 0; i < G->vertex_num; ++i) { visited[i] = 0; distance[i] = -1; }
    count = 0;
    int components = 1;
    bfs_component(G, source, visited, order, &count, distance, 1);
    for (int i = 0; i < G->vertex_num; ++i) {
        if (!visited[i]) {
            ++components;
            bfs_component(G, i, visited, order, &count, distance, 0);
        }
    }
    print_array(order, count); printf("%d\n", components);
    print_array(distance, G->vertex_num);
}
int main(void) {
    int n, m, source;
    if (scanf("%d%d%d", &n, &m, &source) != 3 || n < 1 || n > MAX ||
        m < 0 || m > 12 || source < 1 || source > n) return 1;
    MAT G; initGraph(&G, n);
    for (int i = 0; i < m; ++i) {
        int a, b;
        if (scanf("%d%d", &a, &b) != 2 || a < 1 || a > n || b < 1 || b > n) return 1;
        add_edge(&G, a - 1, b - 1);
    }
    traverse_all(&G, source - 1);
    return 0;
}
