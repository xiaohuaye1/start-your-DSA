#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define BUCKETS 20011
static int heads[BUCKETS], next_index[10001], used;
static char *words[10001];
unsigned hash_word(const char *word) {
    unsigned value=0;for(const unsigned char *p=(const unsigned char*)word;*p;++p)value=(value*131u+*p)%BUCKETS;
    return value;
}
int already_seen(const char *word) {
    /* TODO: scan this bucket's chain and compare complete strings. */
    (void)word;return 0;
}
int main(void) {
    int n;char word[1501];if(scanf("%d",&n)!=1 || n<1 || n>10000)return 1;
    for(int i=0;i<n;++i) {
        if(scanf("%1500s",word)!=1)return 1;
        if(already_seen(word))continue;
        size_t length=strlen(word);char *copy=(char*)malloc(length+1);if(!copy)return 2;
        memcpy(copy,word,length+1);unsigned bucket=hash_word(word);int id=++used;
        words[id]=copy;next_index[id]=heads[bucket];heads[bucket]=id;
    }
    printf("%d\n",used);for(int id=1;id<=used;++id)free(words[id]);return 0;
}
