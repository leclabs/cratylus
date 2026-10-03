export interface ContractShape {
  readonly type: string;
  readonly properties: Readonly<Record<string, { readonly const?: string }>>;
  readonly required: readonly string[];
  readonly additionalProperties: boolean;
}

export type ContractFixtures = Readonly<
  Record<string, Readonly<Record<string, ContractShape>>>
>;
