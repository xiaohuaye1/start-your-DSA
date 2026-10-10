#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define MAX 12
typedef struct TreeNode {
    char data;
    struct TreeNode *lchild, *rchild;
} TreeNode;
typedef struct { TreeNode *data[MAX]; int front, rear; } Queue;

void queueinit(Queue *Q) { Q->front = Q->rear = 0; }
int queuesize(const Queue *Q) { return Q->rear - Q->front; }
int input(Queue *Q, TreeNode *e) {
    if (Q->rear == MAX) return 0;
    Q->data[Q->rear++] = e; return 1;
}
TreeNode *output(Queue *Q) {
    return Q->front < Q->rear ? Q->data[Q->front++] : NULL;
}
void release(TreeNode *T) {
    if (!T) return;
    release(T->lchild); release(T->rchild); free(T);
}
int createTree(TreeNode **T, const char *str, int *idx) {
    char ch = str[(*idx)++];
    if (ch == '#') { *T = NULL; return 1; }
    if (ch < 'A' || ch > 'Z') return 0;
    *T = (TreeNode *)malloc(sizeof(TreeNode));
    if (!*T) return 0;
    (*T)->data = ch; (*T)->lchild = (*T)->rchild = NULL;
    return createTree(&(*T)->lchild, str, idx) && createTree(&(*T)->rchild, str, idx);
}
void preorder(const TreeNode *T) {
    if (!T) return;
    putchar(T->data); preorder(T->lchild); preorder(T->rchild);
}
void inorder(const TreeNode *T) {
    if (!T) return;
    inorder(T->lchild); putchar(T->data); inorder(T->rchild);
}
void postorder(const TreeNode *T) {
    if (!T) return;
    postorder(T->lchild); postorder(T->rchild); putchar(T->data);
}
void levelorder(TreeNode *T) {
    if (!T) return;
    Queue Q; queueinit(&Q); input(&Q, T);
    while (queuesize(&Q)) {
        TreeNode *current = output(&Q);
        putchar(current->data);
        if (current->lchild) input(&Q, current->lchild);
        if (current->rchild) input(&Q, current->rchild);
    }
}
int depth(TreeNode *T) {
    if (!T) return 0;
    Queue Q; queueinit(&Q); input(&Q, T);
    int levels = 0;
    while (queuesize(&Q)) {
        int count = queuesize(&Q);
        while (count--) {
            TreeNode *current = output(&Q);
            if (current->lchild) input(&Q, current->lchild);
            if (current->rchild) input(&Q, current->rchild);
        }
        ++levels;
    }
    return levels;
}
int leafCount(const TreeNode *T) {
    if (!T) return 0;
    if (!T->lchild && !T->rchild) return 1;
    return leafCount(T->lchild) + leafCount(T->rchild);
}
int nodeCount(const TreeNode *T) {
    return T ? 1 + nodeCount(T->lchild) + nodeCount(T->rchild) : 0;
}
int main(void) {
    char str[MAX * 2 + 2];
    TreeNode *T = NULL;
    int idx = 0;
    if (scanf("%25s", str) != 1) return 1;
    if (!createTree(&T, str, &idx) || str[idx] != '\0' || nodeCount(T) > MAX) {
        release(T); return 1;
    }
    if (T) preorder(T); else printf("EMPTY"); putchar('\n');
    if (T) inorder(T); else printf("EMPTY"); putchar('\n');
    if (T) postorder(T); else printf("EMPTY"); putchar('\n');
    if (T) levelorder(T); else printf("EMPTY"); putchar('\n');
    printf("%d %d %d\n", depth(T), leafCount(T), nodeCount(T));
    release(T);
    return 0;
}
