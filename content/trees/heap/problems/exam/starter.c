#include <stdio.h>
static int heap[1000001], count;
void push_value(int value) { /* TODO: insert and sift upward. */ (void)value; }
void pop_min(void) { /* TODO: remove root and sift downward. */ }

int main(void) {
    int n;if(scanf("%d",&n)!=1 || n<1 || n>1000000)return 1;
    for(int i=0;i<n;++i) {
        int op,x;if(scanf("%d",&op)!=1)return 1;
        if(op==1){if(scanf("%d",&x)!=1)return 1;push_value(x);}
        else if(op==2){if(count)printf("%d\n",heap[1]);}
        else if(op==3)pop_min();
        else return 1;
    }
    return 0;
}

