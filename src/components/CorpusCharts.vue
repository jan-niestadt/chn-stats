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
      :grouping="stats['titleLevel2']" />

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CorpusChart from './CorpusChart.vue';
import { CorpusStats, CorpusStatsGroup, CorpusStatsGrouping } from '@/types/stats';

const groupName = (group: CorpusStatsGroup) => Object.values(group.identity).join(" / ");

const groupSize = (group: CorpusStatsGroup, sizeType: string) => sizeType === 'tokens' ? group.tokens : group.docs;

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

    lumpTogether(grouping: CorpusStatsGrouping, key: string, shouldLump: (value: string) => boolean, lumpValue: string): CorpusStatsGrouping {
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
        if (shouldLump(group.identity[key])) {
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
      const isWeirdYear = (year: string) => {
        const groups = year.match(/^(\d{4})-(\1)$/);
        return !groups || parseInt(groups[1]) < 1900 || parseInt(groups[1]) > 2100;
      };
      return this.lumpTogether(grouping, 'grouping_year', isWeirdYear, '?');
    },

    // For groups where the specified identity key doesn't indicate a single likely year:
    // lump them together in a "weird group" with ? identity.
    lumpWeirdYearsTogetherOld(grouping: CorpusStatsGrouping, key = 'grouping_year'): CorpusStatsGrouping {

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
