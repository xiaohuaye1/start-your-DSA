#include <stdio.h>
typedef struct Node { int key,left,right,height,size,count; } Node;
static Node nodes[100001]; static int used;
int height(int id) { return id?nodes[id].height:0; }
int size(int id) { return id?nodes[id].size:0; }
void update(int id) {
    int a=height(nodes[id].left), b=height(nodes[id].right);
    nodes[id].height=(a>b?a:b)+1;
    nodes[id].size=size(nodes[id].left)+size(nodes[id].right)+nodes[id].count;
}
int balance(int id) { return height(nodes[id].left)-height(nodes[id].right); }
int rotate_right(int root) {
    int child=nodes[root].left; nodes[root].left=nodes[child].right; nodes[child].right=root;
    update(root); update(child); return child;
}
int rotate_left(int root) {
    int child=nodes[root].right; nodes[root].right=nodes[child].left; nodes[child].left=root;
    update(root); update(child); return child;
}
int rebalance(int root) {
    if (!root) return 0;
    update(root);
    if (balance(root)>1) {
        if (balance(nodes[root].left)<0) nodes[root].left=rotate_left(nodes[root].left);
        return rotate_right(root);
    }
    if (balance(root)<-1) {
        if (balance(nodes[root].right)>0) nodes[root].right=rotate_right(nodes[root].right);
        return rotate_left(root);
    }
    return root;
}
int insert_node(int root,int key) {
    if (!root) {
        int id=++used; nodes[id].key=key; nodes[id].height=nodes[id].size=nodes[id].count=1;
        return id;
    }
    if (key==nodes[root].key) ++nodes[root].count;
    else if (key<nodes[root].key) nodes[root].left=insert_node(nodes[root].left,key);
    else nodes[root].right=insert_node(nodes[root].right,key);
    return rebalance(root);
}
static int printed;
void inorder(int root) {
    if (!root) return;
    inorder(nodes[root].left);
    for (int i=0; i<nodes[root].count; ++i) { if(printed++) putchar(' '); printf("%d",nodes[root].key); }
    inorder(nodes[root].right);
}
int main(void) {
    int n,root=0; if(scanf("%d",&n)!=1 || n<1 || n>100) return 1;
    for(int i=0;i<n;++i) {int key;if(scanf("%d",&key)!=1)return 1;root=insert_node(root,key);}
    printf("%d %d\n",nodes[root].key,height(root)); inorder(root); putchar('\n'); return 0;
}

