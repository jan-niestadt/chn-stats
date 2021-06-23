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
      type="column" 
      yAxis="tokens" 
      title="Tokens per languageVariant per year" 
      :grouping="lumpWeirdYearsTogether(makeNested(chnStats['grouping_year,languageVariant'], ['grouping_year', 'languageVariant']))" />

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CorpusCharts from './components/CorpusCharts.vue';
import HighchartsVue from 'highcharts-vue';
import chnStats from './assets/stats.json';
import { CorpusStatsGroup, CorpusStatsGrouping, CorpusStatsNestedGrouping } from './types/stats';

Vue.use(HighchartsVue);

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
    makeNested(grouping: CorpusStatsGrouping, fields: string[]): CorpusStatsNestedGrouping {
      
    },

    // For groups where the specified identity key doesn't indicate a single likely year:
    // lump them together in a "weird group" with ? identity.
    lumpWeirdYearsTogether(grouping: CorpusStatsGrouping, key = 'grouping_year'): CorpusStatsGrouping {
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

        // Is this a weird one?
        // - not of the form YYYY-YYYY
        // - not two identical years
        // - years before 1900 or after 2100
        const groups = group.identity[key].match(/^(\d{4})-(\1)$/);
        if (!groups || parseInt(groups[1]) < 1900 || parseInt(groups[1]) > 2100) {
          // Lump together with the other weirdos
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

</style>
