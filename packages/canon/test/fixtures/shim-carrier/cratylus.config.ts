// canon plus a one-skill plugin whose cell declares a runtime capability, so a
// real projection carries a thin shim for the gates that read one. The plugin
// self-locates its skills dir, as canon does.

import { fileURLToPath } from 'node:url';
import canon from '@cratylus/canon';

export default {
  extends: [
    canon,
    {
      name: 'shim-carrier',
      skills: fileURLToPath(new URL('./skills', import.meta.url)),
    },
  ],
  patches: [],
};
