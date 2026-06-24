import type { Effectors } from '@leclabs/koine/anatomy';

export const retrieval: Effectors = {
  organ: 'effectors',
  slug: 'retrieval',
  definiens: `Read-only information access: search/query/fetch over data sources (web, DB, vector index, docs, APIs) that observes without mutating external state.`,
};
