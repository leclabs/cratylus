import type { Standing } from '@leclabs/agent-forge/anatomy';

export const selfAuthority: Standing = 'decision-authority(self)'
export const icAuthority: Standing = `${selfAuthority} ↾ individual-contribution`

