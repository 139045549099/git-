#ifndef STATS_H
#define STATS_H

typedef struct {
    int count;          // تعداد کل داده‌ها
    double mean;        // میانگین
    double variance;    // واریانس
    double std_dev;     // انحراف معیار
    double min;         // حداقل
    double max;         // حداکثر
} DatasetStats;

int calculate_stats(const double *data, int size, DatasetStats *out_stats);
void print_stats(const DatasetStats *stats);

#endif // STATS_H


#include <stdio.h>
#include <math.h>
#include "stats.h"

int calculate_stats(const double *data, int size, DatasetStats *out_stats) {
    if (data == NULL || out_stats == NULL || size <= 0) {
        return -1;
    }

    double sum = 0.0;
    double min_val = data[0];
    double max_val = data[0];

    for (int i = 0; i < size; i++) {
        sum += data[i];
        if (data[i] < min_val) min_val = data[i];
        if (data[i] > max_val) max_val = data[i];
    }

    out_stats->count = size;
    out_stats->mean = sum / size;
    out_stats->min = min_val;
    out_stats->max = max_val;

    double variance_sum = 0.0;
    for (int i = 0; i < size; i++) {
        double diff = data[i] - out_stats->mean;
        variance_sum += (diff * diff);
    }

    out_stats->variance = (size > 1) ? (variance_sum / (size - 1)) : 0.0;
    out_stats->std_dev = sqrt(out_stats->variance);

    return 0;
}

void print_stats(const DatasetStats *stats) {
    if (stats == NULL) return;

    printf("\n=========================================\n");
    printf("         DATASET STATISTICAL REPORT      \n");
    printf("=========================================\n");
    printf(" Sample Count (N) : %d\n", stats->count);
    printf(" Mean             : %.4f\n", stats->mean);
    printf(" Variance         : %.4f\n", stats->variance);
    printf(" Std Deviation    : %.4f\n", stats->std_dev);
    printf(" Minimum Value    : %.4f\n", stats->min);
    printf(" Maximum Value    : %.4f\n", stats->max);
    printf("=========================================\n");
}

#include <stdio.h>
#include "stats.h"

int main() {
    double dataset[] = { 12.5, 18.2, 22.4, 15.1, 19.8, 25.0, 17.6 };
    int size = sizeof(dataset) / sizeof(dataset[0]);

    DatasetStats stats;

    if (calculate_stats(dataset, size, &stats) == 0) {
        print_stats(&stats);
    } else {
        fprintf(stderr, "Error: Invalid dataset or size.\n");
        return 1;
    }

    return 0;
}