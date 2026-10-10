#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define MAX 12
typedef struct HuffNode {
    int weight, id;
    struct HuffNode *left, *right;
} HuffNode;
typedef struct { HuffNode *data[MAX * 2]; int size; } MinHeap;

int less(const HuffNode *a, const HuffNode *b) {
    return a->weight < b->weight || (a->weight == b->weight && a->id < b->id);
}
void heap_push(MinHeap *H, HuffNode *node) {
    int position = ++H->size;
    while (position > 1 && less(node, H->data[position / 2])) {
        H->data[position] = H->data[position / 2]; position /= 2;
    }
    H->data[position] = node;
}
HuffNode *heap_pop(MinHeap *H) {
    if (!H->size) return NULL;
    HuffNode *root = H->data[1], *last = H->data[H->size--];
    if (!H->size) return root;
    int position = 1;
    while (position * 2 <= H->size) {
        int child = position * 2;
        if (child + 1 <= H->size && less(H->data[child + 1], H->data[child])) ++child;
        if (!less(H->data[child], last)) break;
        H->data[position] = H->data[child]; position = child;
    }
    H->data[position] = last;
    return root;
}
HuffNode *new_node(int weight, int id, HuffNode *left, HuffNode *right) {
    HuffNode *node = (HuffNode *)malloc(sizeof(HuffNode));
    if (node) { node->weight = weight; node->id = id; node->left = left; node->right = right; }
    return node;
}
void release(HuffNode *node) {
    if (!node) return;
    release(node->left); release(node->right); free(node);
}
void release_heap(MinHeap *H) {
    while (H->size) release(heap_pop(H));
}
HuffNode *build(MinHeap *H, int n) {
    int id = n;
    while (H->size > 1) {
        HuffNode *left = heap_pop(H), *right = heap_pop(H);
        HuffNode *parent = new_node(left->weight + right->weight, ++id, left, right);
        if (!parent) { release(left); release(right); release_heap(H); return NULL; }
        heap_push(H, parent);
    }
    return heap_pop(H);
}
void collect_codes(const HuffNode *node, char path[], int depth,
                   char codes[MAX + 1][MAX + 1], int *wpl) {
    if (!node->left && !node->right) {
        path[depth] = '\0';
        strcpy(codes[node->id], depth ? path : "0");
        *wpl += node->weight * depth;
        return;
    }
    path[depth] = '0'; collect_codes(node->left, path, depth + 1, codes, wpl);
    path[depth] = '1'; collect_codes(node->right, path, depth + 1, codes, wpl);
}
int main(void) {
    int n, weight;
    MinHeap H = {{NULL}, 0};
    if (scanf("%d", &n) != 1 || n < 1 || n > MAX) return 1;
    for (int i = 1; i <= n; ++i) {
        if (scanf("%d", &weight) != 1 || weight < 1 || weight > 100) { release_heap(&H); return 1; }
        HuffNode *leaf = new_node(weight, i, NULL, NULL);
        if (!leaf) { release_heap(&H); return 1; }
        heap_push(&H, leaf);
    }
    HuffNode *root = build(&H, n);
    if (!root) return 1;
    char path[MAX + 1], codes[MAX + 1][MAX + 1];
    int wpl = 0;
    collect_codes(root, path, 0, codes, &wpl);
    printf("%d\n", wpl);
    for (int i = 1; i <= n; ++i) printf("%d %s\n", i, codes[i]);
    release(root);
    return 0;
}
