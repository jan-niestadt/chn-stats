<template>
  <div id="app">

    <CorpusCharts 
      type="column" 
      yAxis="tokens" 
      title="Tokens per year" 
      :grouping="lumpWeirdYearsTogether(chnStats['grouping_year'])" />

    <CorpusCharts 
      type="pie" 
      yAxis="tokens" 
      title="Tokens per languageVariant" 
      :grouping="chnStats['languageVariant']" />

    <CorpusCharts 
      type="stacked-column" 
      yAxis="tokens" 
      title="Tokens per languageVariant per year" 
      :grouping="makeNested(chnStats['grouping_year,languageVariant'], ['languageVariant', 'grouping_year'])" />

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CorpusCharts from './components/CorpusCharts.vue';
import HighchartsVue from 'highcharts-vue';
import chnStats from './assets/stats.json';
import { CorpusStatsGroup, CorpusStatsGrouping } from './types/stats';

Vue.use(HighchartsVue);

// TODO: make this work for other corpora as well (right now it's pretty much CHN-only...)

export default Vue.extend({
  name: 'App',
  components: {
    CorpusCharts
  },
  data() {
    return {
      chnStats
    };
  },
  methods: {

    // Given a grouping on two fields, turn it into a nested grouping
    makeNested(grouping: CorpusStatsGrouping, fields: string[]): CorpusStatsGrouping {

      // Separate out the groups by year
      const yearKey = fields[0];
      const otherKey = fields[1];
      const groupsByYear: Record<string,CorpusStatsGroup[]> = {};
      for (let group of grouping.groups) {
        const year = group.identity[yearKey];
        if (!(year in groupsByYear))
          groupsByYear[year] = [];
        groupsByYear[year].push(group);
      }

      // Given a tuple of year and the groups in that year,
      // create a CorpusStatsGroup with nested groups, so we know the
      // grouping of the other property within that year and can show
      // it in a stacked column chart.
      const entryToNestedGroup = ([year, groupsInYear]: [string, CorpusStatsGroup[]]) => {
        const docs: number = groupsInYear.reduce( (n: number, group: CorpusStatsGroup) => n + group.docs, 0);
        const tokens: number = groupsInYear.reduce( (n: number, group: CorpusStatsGroup) => n + group.tokens, 0);
        return {
          identity: {
            [yearKey]: year,
          },
          docs,
          tokens,
          groups: groupsInYear.map( group => {
            return { 
              identity: {
                [otherKey]: group.identity[otherKey]
              },
              docs: group.docs,
              tokens: group.tokens,
            };
          }),
        };
      };

      // Create the nested groups
      const groups: CorpusStatsGroup[] = Object.entries(groupsByYear).map(entryToNestedGroup);
      return {
        docs: grouping.docs,
        tokens: grouping.tokens,
        groups,
      };
    },

    // For groups where the specified identity key doesn't indicate a single likely year:
    // lump them together in a "weird group" with ? identity.
    lumpWeirdYearsTogether(grouping: CorpusStatsGrouping, key = 'grouping_year'): CorpusStatsGrouping {

      // Is this a weird year?
      // - not of the form YYYY-YYYY
      // - not two identical years
      // - years before 1900 or after 2100
      const isWeirdYear = (year: string) => {
        const groups = year.match(/^(\d{4})-(\1)$/);
        return !groups || parseInt(groups[1]) < 1900 || parseInt(groups[1]) > 2100;
      };

      const weirdGroup = {
        identity: {} as Record<string,string>,
        docs: 0,
        tokens: 0,
      };
      const resultingGroups: CorpusStatsGroup[] = [];
      for (const group of grouping.groups) {
        // Is weirdGroup identity initialized?
        if (Object.keys(weirdGroup.identity).length === 0) {
          // Set all identity components to ?
          weirdGroup.identity = group.identity;
          Object.keys(weirdGroup.identity).forEach(key => weirdGroup.identity[key] = '?');
        }

        // Is this a weird year value?
        if (isWeirdYear(group.identity[key])) {
          // Yes; lump together with the other weirdos
          weirdGroup.docs += group.docs;
          weirdGroup.tokens += group.tokens;
        } else {
          resultingGroups.push(group);
        }
      }

      resultingGroups.push(weirdGroup);
      return {
        tokens: grouping.tokens,
        docs: grouping.docs,
        groups: resultingGroups,
      };
    }
  },
});
</script>

<style lang="scss">

#app {
  max-width: 60rem;
}

</style>
