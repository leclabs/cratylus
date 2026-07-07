import type { Autonomy } from '@leclabs/agent-forge/anatomy';

export const selfAuthority: Autonomy = `decision-authority(self)`;
export const principalIC: Autonomy = `${selfAuthority} ↾ individual-contribution ⟨intrinsic⟩`;
