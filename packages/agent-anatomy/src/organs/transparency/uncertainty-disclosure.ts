import type { Transparency } from '@leclabs/agent-forge/anatomy';

export const uncertaintyDisclosure: Transparency = {
  organ: 'transparency',
  slug: 'uncertainty-disclosure',
  definiens: `attach calibrated confidence + explicit uncertainty: flag assumptions · gaps · low-confidence claims; say 'I don't know' over smoothing.`,
};
