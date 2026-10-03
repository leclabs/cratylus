export interface ContractProperty {
  readonly const?: string;
  readonly type?: string;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly items?: ContractShape;
}

export interface ContractShape {
  readonly type: string;
  readonly properties: Readonly<Record<string, ContractProperty>>;
  readonly required: readonly string[];
  readonly additionalProperties: boolean;
  readonly items?: ContractShape;
}

export type ContractFixtures = Readonly<
  Record<string, Readonly<Record<string, ContractShape>>>
>;
