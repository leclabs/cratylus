import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import type * as TypeScript from 'typescript';
import {
  type Scenario,
  decisionReferences,
  journalCalls,
  statesOneHourWindow,
  succeeded,
} from '../../../../packages/cli/test/capability-port/check.js';
import {
  type Recording,
  type Verdict,
  isActing,
  readbackClauses,
} from '../../../../packages/cli/test/concept-journal-reconstitution/check.js';

const require = createRequire(
  new URL('../../../../packages/cli/package.json', import.meta.url),
);
const ts: typeof TypeScript = require('typescript');

// These judges are private to frozen test files. Loading only the named AST
// declarations preserves their implementation without importing/running their
// original suites, preflights or live work. No frozen source is rewritten.
function declarations(file: URL, names: readonly string[]): string {
  const source = ts.createSourceFile(
    file.pathname,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const selected = new Map<string, string>();
  for (const statement of source.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      names.includes(statement.name.text)
    ) {
      selected.set(statement.name.text, statement.getText(source));
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          names.includes(declaration.name.text)
        ) {
          selected.set(
            declaration.name.text,
            `const ${declaration.getText(source)};`,
          );
        }
      }
    }
  }
  for (const name of names)
    if (!selected.has(name))
      throw new Error(`Frozen declaration ${name} not found in ${file}`);
  return ts.transpileModule([...selected.values()].join('\n'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
}

export const retirementJudge: (recording: Recording) => Verdict =
  runInNewContext(
    `${declarations(new URL('../concept-journal/reconstitution.test.ts', import.meta.url), ['target', 'assess'])}\nassess;`,
    { isActing, readbackClauses },
  );
export const acceptance: Scenario = runInNewContext(
  `${declarations(new URL('../../delivery/capability-port/behavioral.test.ts', import.meta.url), ['acceptance'])}\nacceptance;`,
  { journalCalls, succeeded, decisionReferences, statesOneHourWindow },
);
