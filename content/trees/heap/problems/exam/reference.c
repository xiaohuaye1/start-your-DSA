#include <stdio.h>
static int heap[1000001], count;
void push_value(int value) {
    int index=++count; heap[index]=value;
    while(index>1 && heap[index]<heap[index/2]) {
        int t=heap[index];heap[index]=heap[index/2];heap[index/2]=t;index/=2;
    }
}
void pop_min(void) {
    if(!count)return;
    heap[1]=heap[count--]; int index=1;
    for(;;) {
        int best=index,left=index*2,right=left+1;
        if(left<=count && heap[left]<heap[best])best=left;
        if(right<=count && heap[right]<heap[best])best=right;
        if(best==index)break;
        int t=heap[index];heap[index]=heap[best];heap[best]=t;index=best;
    }
}
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

