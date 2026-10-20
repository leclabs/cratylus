// A one-skill plugin whose cell declares a runtime capability, projected beside canon
// so a real projection carries a thin shim for the gates that read one. The plugin
// self-locates its skills dir, as canon does.

import { fileURLToPath } from 'node:url';

export default {
  name: 'shim-carrier',
  skills: fileURLToPath(new URL('./skills', import.meta.url)),
};
