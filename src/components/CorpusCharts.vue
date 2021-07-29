<template>
  <div>

    <CorpusChart 
      type="column" 
      yAxis="tokens" 
      title="Tokens per year" 
      :grouping="lumpWeirdYearsTogether(stats['grouping_year'])" />

    <CorpusChart 
      type="stacked-column" 
      yAxis="tokens" 
      title="Tokens per languageVariant per year" 
      :grouping="makeNested(lumpWeirdYearsTogether(stats['grouping_year,languageVariant']), ['grouping_year', 'languageVariant'])" />

    <CorpusChart 
      type="stacked-column" 
      yAxis="tokens" 
      title="Tokens per medium per year" 
      :grouping="makeNested(lumpWeirdYearsTogether(stats['grouping_year,medium']), ['grouping_year', 'medium'])" />

    <CorpusChart 
      type="stacked-column" 
      yAxis="tokens" 
      title="Tokens per newspaper per year" 
      :grouping="makeNested(lumpWeirdYearsTogether(stats['grouping_year,titleLevel2']), ['grouping_year', 'titleLevel2'])" />

    <CorpusChart 
      type="pie" 
      yAxis="tokens" 
      title="Tokens per languageVariant" 
      :grouping="stats['languageVariant']" />

    <CorpusChart 
      type="pie" 
      yAxis="tokens" 
      title="Tokens per medium" 
      :grouping="stats['medium']" />

    <CorpusChart 
      type="stacked-column" 
      yAxis="tokens" 
      title="Tokens per languageVariant per medium" 
      :grouping="makeNested(stats['medium,languageVariant'], ['medium', 'languageVariant'])" />

    <CorpusChart 
      type="pie" 
      yAxis="tokens" 
      title="Tokens per newspaper" 
      :grouping="lumpSmallGroupsTogether(stats['titleLevel2'], 10000000)" />

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CorpusChart from './CorpusChart.vue';
import { CorpusStats, CorpusStatsGroup, CorpusStatsGrouping } from '@/types/stats';

export default Vue.extend({
  name: 'CorpusCharts',
  components: {
    CorpusChart,
  },
  props: {
    stats: Object as () => CorpusStats,
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

    lumpTogether(grouping: CorpusStatsGrouping, shouldLump: (value: CorpusStatsGroup) => boolean, lumpValue: string): CorpusStatsGrouping {
      const lump = {
        identity: {} as Record<string,string>,
        docs: 0,
        tokens: 0,
      };
      const resultingGroups: CorpusStatsGroup[] = [];
      for (const group of grouping.groups) {
        // Is lump's identity initialized?
        if (Object.keys(lump.identity).length === 0) {
          // Set all identity components to the lump value, e.g. "other", "unknown", etc.
          lump.identity = group.identity;
          Object.keys(lump.identity).forEach(key => lump.identity[key] = lumpValue);
        }

        // Is this a lumpable value?
        if (shouldLump(group)) {
          // Yes; put it with the other lumpables
          lump.docs += group.docs;
          lump.tokens += group.tokens;
        } else {
          resultingGroups.push(group);
        }
      }

      resultingGroups.push(lump);
      return {
        tokens: grouping.tokens,
        docs: grouping.docs,
        groups: resultingGroups,
      };
    },

    lumpWeirdYearsTogether(grouping: CorpusStatsGrouping): CorpusStatsGrouping {
      // Is this a weird year?
      // - not of the form YYYY-YYYY
      // - not two identical years
      // - years before 1900 or after 2100
      const isWeirdYear = (group: CorpusStatsGroup) => {

        // Is this a lumpable value?
        const strYear = group.identity['grouping_year'];
        const groups = strYear.match(/^(\d{4})-(\1)$/);
        if (!groups)
          return true;
        const year = parseInt(groups[1]);
        return year < 1900 || year > 2100;
      };
      return this.lumpTogether(grouping, isWeirdYear, '?');
    },

    lumpSmallGroupsTogether(grouping: CorpusStatsGrouping, threshold: number): CorpusStatsGrouping {
      // Is this a small group?
      // - tokens size smaller than threshold?
      const isSmallGroup = (group: CorpusStatsGroup) => group.tokens < threshold;
      return this.lumpTogether(grouping, isSmallGroup, 'other');
    },

  },
});
</script>
