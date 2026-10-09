#include <stdio.h>
static int dp[100+1];
void apply_item(int capacity,int weight,int value) {
    for(int c=capacity;c>=weight;--c) {
        int candidate=dp[c-weight]+value;if(candidate>dp[c])dp[c]=candidate;
    }
}
int main(void) {
    int n,capacity;
    if(scanf("%d%d",&n,&capacity)!=2 || n<1 || n>100 || capacity<1 || capacity>100)return 1;
    for(int i=0;i<n;++i) {
        int weight,value;if(scanf("%d%d",&weight,&value)!=2 || weight<1 || value<1)return 1;
        apply_item(capacity,weight,value);
    }
    printf("%d\n",dp[capacity]);return 0;
}
