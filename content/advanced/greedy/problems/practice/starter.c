#include <stdio.h>
#include <stdlib.h>
typedef struct Activity { int start, end; } Activity;
static Activity activities[100];
int compare_end(const void *left,const void *right) {
    const Activity *a=(const Activity*)left,*b=(const Activity*)right;
    if(a->end!=b->end)return a->end<b->end?-1:1;
    return (a->start>b->start)-(a->start<b->start);
}
int maximum_nonoverlap(int n) {
    /* TODO: sort by end, then take compatible activities (start>=last_end). */
    (void)n;return 0;
}
int main(void) {
    int n;if(scanf("%d",&n)!=1 || n<1 || n>100)return 1;
    for(int i=0;i<n;++i)if(scanf("%d%d",&activities[i].start,&activities[i].end)!=2 || activities[i].start<0 || activities[i].start>=activities[i].end)return 1;
    printf("%d\n",maximum_nonoverlap(n));return 0;
}
