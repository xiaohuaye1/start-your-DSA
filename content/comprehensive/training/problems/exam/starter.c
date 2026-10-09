#include <stdio.h>
static long long heap[10000+1];static int count;
void push_weight(long long value) {
    int p=++count;heap[p]=value;
    while(p>1 && heap[p]<heap[p/2]) {long long t=heap[p];heap[p]=heap[p/2];heap[p/2]=t;p/=2;}
}
long long pop_weight(void) {
    long long value=heap[1];heap[1]=heap[count--];int p=1;
    for(;;){int best=p,left=2*p,right=left+1;
        if(left<=count && heap[left]<heap[best])best=left;
        if(right<=count && heap[right]<heap[best])best=right;
        if(best==p)break;
        long long t=heap[p];heap[p]=heap[best];heap[best]=t;p=best;
    }return value;
}
long long merge_cost(void) {
    /* TODO: pop two minima, add their sum to total, push the merged weight. */
    return 0;
}
int main(void) {
    int n;if(scanf("%d",&n)!=1 || n<1 || n>10000)return 1;
    for(int i=0;i<n;++i){long long value;if(scanf("%lld",&value)!=1 || value<1)return 1;push_weight(value);}
    printf("%lld\n",merge_cost());return 0;
}
