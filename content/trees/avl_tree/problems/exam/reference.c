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
int erase_one(int root,int key) {
    if (!root) return 0;
    if (key<nodes[root].key) nodes[root].left=erase_one(nodes[root].left,key);
    else if (key>nodes[root].key) nodes[root].right=erase_one(nodes[root].right,key);
    else if (nodes[root].count>1) --nodes[root].count;
    else if (!nodes[root].left || !nodes[root].right) return nodes[root].left?nodes[root].left:nodes[root].right;
    else {
        int successor=nodes[root].right;
        while (nodes[successor].left) successor=nodes[successor].left;
        nodes[root].key=nodes[successor].key; nodes[root].count=nodes[successor].count;
        nodes[successor].count=1;
        nodes[root].right=erase_one(nodes[root].right,nodes[successor].key);
    }
    return rebalance(root);
}
int rank_of(int root,int key) {
    int result=1;
    while (root) {
        if (key<=nodes[root].key) root=nodes[root].left;
        else { result+=size(nodes[root].left)+nodes[root].count; root=nodes[root].right; }
    }
    return result;
}
int kth(int root,int k) {
    while (root) {
        int left=size(nodes[root].left);
        if (k<=left) root=nodes[root].left;
        else if (k<=left+nodes[root].count) return nodes[root].key;
        else { k-=left+nodes[root].count; root=nodes[root].right; }
    }
    return 0;
}
int neighbor(int root,int key,int successor) {
    int answer=0;
    while (root) {
        if (successor?nodes[root].key>key:nodes[root].key<key) {
            answer=nodes[root].key; root=successor?nodes[root].left:nodes[root].right;
        } else root=successor?nodes[root].right:nodes[root].left;
    }
    return answer;
}
int main(void) {
    int n,root=0; if(scanf("%d",&n)!=1 || n<1 || n>100000) return 1;
    for(int i=0;i<n;++i) {
        int op,x; if(scanf("%d%d",&op,&x)!=2) return 1;
        if(op==1) root=insert_node(root,x);
        else if(op==2) root=erase_one(root,x);
        else if(op==3) printf("%d\n",rank_of(root,x));
        else if(op==4) printf("%d\n",kth(root,x));
        else if(op==5||op==6) printf("%d\n",neighbor(root,x,op==6));
        else return 1;
    }
    return 0;
}

