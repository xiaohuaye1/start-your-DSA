#include <stdio.h>
#define CAPACITY 11
typedef struct Slot { int state, key, count; } Slot; /* 0 EMPTY, 1 LIVE, 2 DEL */
static Slot table[CAPACITY];
int home(int key) { return (key%CAPACITY+CAPACITY)%CAPACITY; }
int find_slot(int key, int inserting) {
    int first_deleted=-1, start=home(key);
    for(int offset=0;offset<CAPACITY;++offset) {
        int index=(start+offset)%CAPACITY;
        if(table[index].state==1 && table[index].key==key) return index;
        if(table[index].state==2 && first_deleted<0) first_deleted=index;
        if(table[index].state==0) return inserting?(first_deleted>=0?first_deleted:index):-1;
    }
    return inserting?first_deleted:-1;
}
int main(void) {
    int q;if(scanf("%d",&q)!=1 || q<1 || q>100)return 1;
    for(int i=0;i<q;++i) {
        int op,key;if(scanf("%d%d",&op,&key)!=2)return 1;
        int slot=find_slot(key,op==1);
        if(op==1) {
            if(slot>=0) {if(table[slot].state==1)++table[slot].count;
                else {table[slot].state=1;table[slot].key=key;table[slot].count=1;}}
        } else if(op==2) {
            if(slot>=0 && --table[slot].count==0)table[slot].state=2;
        } else if(op==3) printf("%d\n",slot>=0?table[slot].count:0);
        else return 1;
    }
    return 0;
}
