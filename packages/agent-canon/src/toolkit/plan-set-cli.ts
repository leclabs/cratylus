// plan-set-cli.ts — the runnable praxis affordance for the PLAN-LEVEL lifecycle
// (`plan-set.ts`). Reads plan-phase / membership / landing off ground truth
// (on-disk residence + git), never a stored field; `retire`/`supersede` stage
// (the commit is gated).
//
//   tsx src/toolkit/plan-set-cli.ts phase <plan>        # the plan's lifecycle phase
//   tsx src/toolkit/plan-set-cli.ts landing <plan>      # landing-commit sha (or none)
//   tsx src/toolkit/plan-set-cli.ts list [--retired]    # in-scope plans (or archive)
//   tsx src/toolkit/plan-set-cli.ts supersede <plan> <by> # declare P superseded-by Q (staged)
//   tsx src/toolkit/plan-set-cli.ts retire <plan>       # git mv → plans/.retired/ (staged)

import {
  defaultContext,
  landing,
  list,
  phase,
  retire,
  supersede,
} from './plan-set.js';

function main(argv: string[]): number {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'phase': {
      const plan = rest[0];
      if (!plan) {
        process.stderr.write('usage: plan-set phase <plan>\n');
        return 2;
      }
      process.stdout.write(`${phase(defaultContext, plan)}\n`);
      return 0;
    }
    case 'landing': {
      const plan = rest[0];
      if (!plan) {
        process.stderr.write('usage: plan-set landing <plan>\n');
        return 2;
      }
      const sha = landing(defaultContext, plan);
      process.stdout.write(`${sha ?? '(not landed)'}\n`);
      return sha ? 0 : 1;
    }
    case 'list': {
      const retired = rest.includes('--retired');
      for (const p of list(defaultContext, { retired })) {
        process.stdout.write(`${p}\n`);
      }
      return 0;
    }
    case 'supersede': {
      const [plan, by] = rest;
      if (!plan || !by) {
        process.stderr.write('usage: plan-set supersede <plan> <by>\n');
        return 2;
      }
      try {
        supersede(defaultContext, plan, by);
      } catch (e) {
        process.stderr.write(`${(e as Error).message}\n`);
        return 1;
      }
      process.stdout.write(
        `superseded ${plan} → by ${by} (marker staged; commit gated)\n`,
      );
      return 0;
    }
    case 'retire': {
      const plan = rest[0];
      if (!plan) {
        process.stderr.write('usage: plan-set retire <plan>\n');
        return 2;
      }
      try {
        retire(defaultContext, plan);
      } catch (e) {
        process.stderr.write(`${(e as Error).message}\n`);
        return 1;
      }
      process.stdout.write(
        `retired ${plan} → plans/.retired/${plan} (staged; commit gated)\n`,
      );
      return 0;
    }
    default:
      process.stderr.write(
        'usage: plan-set <phase|landing|list|supersede|retire> [args]\n',
      );
      return 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
