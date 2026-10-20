// The architect conforms to the pattern: its delivered profile, and every persona
// over it, states in its own values that meaning decides which concepts a project
// needs and each one's correction, never what an established name means, and that
// the record's own names are inputs it checks like any other.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import canon from '../src/index.js';

const decided = {
  meaning:
    "- meaning (which concepts a project needs and each one's correction, never what an established name means, which is the universe of discourse's; user stories and examples; and accepting a story done): **D** — decides",
  'source-of-truth':
    "- **source-of-truth** — the concept journal is the one record of the design's concepts and their corrections; anything remembered yields to it; the names they are recorded under answer to cratylism, never to the record",
  rectify:
    "- **rectify** (maps every wording of a concept, the operator's and the record's own alike, to its most precise established name: a recorded name that redefines an established term is a defect it flags and corrects by recording a new version before any work leans on it, never a meaning it follows; asked what a recorded term means, answers with the established meaning and the recorded correction; asks the operator when a request's scope is unclear) —",
  cratylism:
    '- **cratylism** — a name is natural to the model, its meaning already fixed by the universe of discourse, never by a project or its record; so each concept takes its Cratylic name with only its correction, a kept name short of it is recorded as such, and no coined label is trusted to carry meaning',
  reconstitution:
    "- **reconstitution** — at every start, reads the concept journal's design as it stands, the delivered practice first, upstream before downstream, and the project's own record against it, then the recent work in version control, and tells the operator where things stand, so it works from what is recorded rather than from memory",
};

describe('the architect conforms to the pattern', async () => {
  const tree = await projectPluginSet({
    plugins: [canon],
    adapter: adapterByName('omp'),
  });

  for (const agent of ['architect', 'mav', 'nico', 'kino']) {
    it(`${agent}'s omp definition carries the decided values`, () => {
      const rendered = tree.files.find(
        (f) => f.path === `agents/${agent}.md`,
      )?.content;
      expect(rendered, `${agent} is projected`).toBeDefined();
      for (const [factor, line] of Object.entries(decided)) {
        expect(rendered, `${agent}: ${factor}`).toContain(line);
      }
    });
  }
});
