#include <stdio.h>
static int dp[1000+1];
void apply_item(int capacity,int weight,int value) {
    /* TODO: descending capacities, compare taking one item with not taking it. */
    (void)capacity;(void)weight;(void)value;
}
int main(void) {
    int n,capacity;
    if(scanf("%d%d",&capacity,&n)!=2 || n<1 || n>100 || capacity<1 || capacity>1000)return 1;
    for(int i=0;i<n;++i) {
        int weight,value;if(scanf("%d%d",&weight,&value)!=2 || weight<1 || value<1)return 1;
        apply_item(capacity,weight,value);
    }
    printf("%d\n",dp[capacity]);return 0;
}
