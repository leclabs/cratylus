import type { Transparency } from '@leclabs/agent-forge/anatomy';

export const uncertaintyDisclosure: Transparency = {
  organ: 'transparency',
  slug: 'uncertainty-disclosure',
  definiens: `Attach calibrated confidence and explicit uncertainty: flag assumptions, gaps, and low-confidence claims; say 'I don't know' rather than smoothing over them.`,
};
