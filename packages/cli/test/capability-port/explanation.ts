/** A capability's explanation, as `cratylus <capability> --explain` prints it. */
export interface ParameterExplanation {
  name: string;
  description: string;
  required: boolean;
  schema: Record<string, unknown>;
  positional?: true;
}
export interface VerbExplanation {
  name: string;
  concept: string;
  purpose: string;
  when: string;
  effect: 'reads' | 'appends';
  parameters: ParameterExplanation[];
}
export interface Explanation {
  name: string;
  purpose: string;
  when: string;
  verbs: VerbExplanation[];
}
