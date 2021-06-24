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

const groupSize = (group: CorpusStatsGroup, sizeType: string) => sizeType === 'tokens' ? group.tokens : group.docs;

export default Vue.extend({
  name: 'CorpusChart',
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
      let tooltip: Highcharts.TooltipOptions = {
          pointFormat: '<b>{point.y} ({point.percentage:.1f}%)</b>',
      };
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
        tooltip.pointFormat =  '<b>{point.y}</b>';

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

        plotOptions = {
          pie: {
            dataLabels: {
              enabled: false,
              // See https://www.highcharts.com/forum/viewtopic.php?t=15691
              //enabled: true,
              //format: '<b>{point.percentage:.1f}%</b>',
              //distance: -60,
            },
            showInLegend: true,
          },
        };

      } else if (this.type === 'stacked-column') {

        // Categories on x-axis: all the unique outer group values (e.g. years)
        categories = [...new Set(groups.map(group => groupName(group)))];
        //window.console.log(series, categories);

        // Determine our series names (e.g. languageVariants)
        const seriesNamesSet: Set<string> = new Set();
        for (let group of groups) {
          if (group.groups) {
            for (let group2 of group.groups) {
              seriesNamesSet.add(groupName(group2));
            }
          }
        }
        const seriesNames = [...seriesNamesSet].sort().reverse();

        // Stacked column chart
        series = seriesNames.map(seriesName => {
          return {
            name: seriesName,
            type: 'column',
            data: groups.map(group => groupSize(group.groups?.find(g2 => groupName(g2) === seriesName) || { identity: {}, docs: 0, tokens : 0 }, this.yAxis)),
          };
        });
        
        plotOptions = {
          column: {
            stacking: 'normal',
          },
        };

        tooltip.pointFormat = '{series.name}<br/><b>{point.y} ({point.percentage:.1f}%)</b>';

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
        series,
        plotOptions,
        // V2 colors:
        colors: ['#4572A7', '#AA4643', '#89A54E', '#80699B', '#3D96AE', '#DB843D', '#92A8CD', '#A47D7C', '#B5CA92'],
        //DEFAULT colors: ["#7cb5ec", "#434348", "#90ed7d", "#f7a35c", "#8085e9", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
        //V3 colors: ['#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a'],
        tooltip,
        legend: {
          align: 'right',
          verticalAlign: 'top',
          layout: 'vertical',
          enabled: this.type === 'pie' || this.type == 'stacked-column',
        },
        credits: {
            enabled: false
        },
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
