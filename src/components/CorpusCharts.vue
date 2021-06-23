<template>
  <div>
    <highcharts :options="chartOptions"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as Highcharts from 'highcharts';
import { CorpusStats, CorpusStatsGroup, CorpusStatsGrouping } from '@/types/stats';

// TODO: make this work for other corpora as well (right now it's pretty much CHN-only...)

const groupName = (group: CorpusStatsGroup) => Object.values(group.identity).join(" / ");

export default Vue.extend({
  name: 'CorpusCharts',
  props: {
    grouping: Object as () => CorpusStatsGrouping,
    type: String,
    yAxis: String,
    title: String,
  },
  computed: {

    chartOptions(): Highcharts.Options {
      const grouping = this.grouping;
      const groups = grouping.groups;

      let series: Highcharts.SeriesOptionsType[];
      if (this.type === 'column' || this.type === 'bar') {
        // Column or bar chart
        series = [
          {
            name: this.title,
            type: this.type === 'column' ? 'column' : 'bar',
            data: this.yAxis === 'tokens' ? groups.map(group => group.tokens) : groups.map(group => group.docs),
          }
        ];
      } else if (this.type === 'pie') {

        const data = groups.map(group => {
          return {
            name: groupName(group),
            type: 'pie',
            y: this.yAxis === 'tokens' ? group.tokens : group.docs,
          };
        });

        // Pie chart
        series = [{
          name: this.title,
          type: 'pie',
          data,
        }];
      }

			return {
        chart: {
            type: this.type,
        },
        title: {
            text: this.title,
        },
        xAxis: {
          categories: groups.map(groupName),
          labels: {
            enabled: true,
          },
        },
        yAxis: {
            min: 0,
            title: {
                text: this.yAxis === 'tokens' ? 'Tokens' : 'Documents',
            },
        },
        legend: {
          enabled: false,
        },
        series: series,
      };
		},
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.highcharts-figure, .highcharts-data-table table {
    min-width: 310px; 
    max-width: 800px;
    margin: 1em auto;
}

</style>
