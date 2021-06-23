// stats.json is a collection of CorpusStatsGroupings, keyed
// by the fields grouped on.
// (NOTE: some groupings may be filtered! This information is not currently included in the file)
export type CorpusStats = Record<string, CorpusStatsGrouping>;

// A grouping contains a list of groups and the total docs and tokens.
export interface CorpusStatsGrouping {
  docs: number;
  tokens: number;
  groups: CorpusStatsGroup[];
}

// A group has an identity (the field values that make up this group)
// and a size in docs and tokens.
export interface CorpusStatsGroup {
  identity: Record<string, string>;
  docs: number;
  tokens: number;
  groups?: CorpusStatsGroup[]; // nested groups, if any
}
