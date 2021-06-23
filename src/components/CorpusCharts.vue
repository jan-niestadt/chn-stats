<template>
  <div>
    <highcharts :options="chartOptions"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as Highcharts from 'highcharts';
import { CorpusStatsGroup, CorpusStatsGrouping } from '@/types/stats';

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
      let categories: string[];
      let plotOptions: Highcharts.PlotOptions = {};
      if (this.type === 'column' || this.type === 'bar') {
        // Column or bar chart
        series = [
          {
            name: this.title,
            type: this.type === 'column' ? 'column' : 'bar',
            data: this.yAxis === 'tokens' ? groups.map(group => group.tokens) : groups.map(group => group.docs),
          }
        ];
        categories = groups.map(groupName);
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
        categories = groups.map(groupName);
      } else if (this.type === 'stacked-column') {

        // Stacked column chart
        series = groups.map(group => {
          return {
            name: groupName(group),
            type: 'column',
            data: group.groups!.map(group => this.yAxis === 'tokens' ? group.tokens : group.docs),
          };
        });
        // Categories on x-axis: all the unique inner group values
        categories = [...new Set(groups.map(group => group.groups!.map( gr2 => groupName(gr2) )).flat())];
        //window.console.log(series, categories);
        
        plotOptions = {
          column: {
            stacking: 'normal',
          },
        };

      } else {
        throw `Unknown chart type: ${this.type}`;
      }

			return {
        chart: {
            type: this.type,
        },
        title: {
            text: this.title,
        },
        xAxis: {
          categories,
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
        plotOptions,
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
