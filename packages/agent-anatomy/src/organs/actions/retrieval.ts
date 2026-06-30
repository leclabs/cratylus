import type { Actions } from '@leclabs/agent-forge/anatomy';

export const retrieval: Actions = {
  organ: 'actions',
  slug: 'retrieval',
  definiens: `Read-only information access: search/query/fetch over data sources (web, DB, vector index, docs, APIs) that observes without mutating external state.`,
};
