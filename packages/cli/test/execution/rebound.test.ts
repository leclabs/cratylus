// Ruling 0083: execution 4, 6 and 8 keep their wording; dispatch is the task
// handoff. Execution 14 remains in structural.test.ts and counts harness returns.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Fixture } from '../agent-launch/fixture.js';
import {
  type HookResult,
  type LoadedExtension,
  bindingFixture,
  ledger,
  load,
  task,
} from '../reconstitution/binding/fixture.js';
import {
  type Assignment,
  type ExecutionFixture,
  type Inventory,
  type Levels,
  command,
  cut,
  example,
  examples,
  harnessEvent,
  levelNames,
  log,
  submit,
  write,
} from './fixture.js';
let installed: Fixture;
let f: ExecutionFixture;
let extension: LoadedExtension | undefined;
beforeEach(() => {
  installed = bindingFixture();
  f = {
    root: installed.cwd,
    home: installed.home,
    sandbox: installed.root,
    dispose: () => installed.dispose(),
  };
});
afterEach(() => {
  extension?.restore();
  extension = undefined;
  installed.dispose();
});

function handoff(names: string[], id: string) {
  return {
    type: 'tool_call',
    toolName: 'task',
    toolCallId: id,
    input: {
      agent: 'builder',
      tasks: names.map((name) => {
        const assignment = command<Assignment>(f, 'assignment', name);
        return {
          ...task('builder', {
            cut,
            workPackage: name,
            outputs: assignment.outputs,
            concepts: assignment.concepts,
            examples: assignment.examples.map((e) => e.ref),
          }).input.tasks[0],
          id: name,
        };
      }),
    },
  };
}
async function refused(event: unknown, named: string) {
  const before = log(f);
  const result = await extension!.fire('tool_call', event);
  expect(result?.block, 'dispatch is refused before any agent runs').toBe(true);
  expect(
    result?.reason,
    'refusal names the package / concept / example',
  ).toContain(named);
  expect(
    log(f),
    'nothing dispatched: whole-call refusal appends nothing',
  ).toEqual(before);
}
function allowed(result: HookResult | undefined) {
  expect(result?.block, 'ready builder handoff is not refused').not.toBe(true);
}
function returned(name: string) {
  const event = ledger(installed).find(
    (entry) => entry.kind === 'dispatched' && entry.workPackage === name,
  );
  expect(
    event?.run,
    'finished means returned for the run the harness dispatched',
  ).toEqual(expect.any(String));
  harnessEvent(f, 'returned', 'builder', event!.run as string, name);
}
// 0128/0129: a builder is dispatched only once a frozen check names each
// visible example of its package as <context>/<number>.
function bound(...numbers: number[]) {
  const check = 'checks/delivery.test.ts';
  write(
    f,
    check,
    `// Binds ${numbers.map((n) => `booking/${n}`).join(', ')}.\n`,
  );
  command(f, 'freeze', '--check', check);
}

describe('execution rebound to the harness', () => {
  it('Example 4 — unserved concepts block all dispatch until both are served', async () => {
    examples(f, [example(1, 'window'), example(2, 'reservation')]);
    bound(1, 2);
    submit(f, 'windows', ['window']);
    extension = await load(installed);
    await refused(handoff(['windows'], 'unserved'), 'reservation');
    expect(
      command<Levels>(f, 'levels').levels[0]!.packages,
      'nothing dispatched',
    ).toEqual([{ name: 'windows', state: 'submitted' }]);
    submit(f, 'reservations', ['reservation']);
    allowed(
      await extension.fire(
        'tool_call',
        handoff(['windows', 'reservations'], 'served'),
      ),
    );
    const inventory = command<Inventory>(f, 'inventory');
    expect(
      inventory.concepts,
      'once served, both concepts reported served',
    ).toEqual(
      expect.arrayContaining([
        { name: 'window', context: 'booking', servedBy: ['windows'] },
        { name: 'reservation', context: 'booking', servedBy: ['reservations'] },
      ]),
    );
    expect(inventory.unserved, 'both are reported served').toEqual([]);
  });
  it('0083 — an unowned visible example refuses the whole builder handoff', async () => {
    examples(f, [
      example(1, 'window'),
      example(2, 'reservation'),
      example(3, 'window', 'reservation'),
    ]);
    bound(1, 2, 3);
    submit(f, 'windows', ['window']);
    submit(f, 'reservations', ['reservation']);
    extension = await load(installed);
    await refused(handoff(['windows', 'reservations'], 'unowned'), 'booking/3');
    command(f, 'update', 'reservations', '--depends-on', 'windows');
    allowed(await extension.fire('tool_call', handoff(['windows'], 'owned')));
  });
  it('Example 6 — levels are computed and dispatch waits for every package in the previous level', async () => {
    examples(f, [example(1, 'delivery')]);
    bound(1);
    submit(f, 'A', ['delivery']);
    submit(f, 'B', ['delivery']);
    submit(f, 'C', ['delivery'], ['C.txt'], ['A']);
    submit(f, 'D', ['delivery'], ['D.txt'], ['B']);
    submit(f, 'E', ['delivery'], ['E.txt'], ['C', 'D']);
    expect(
      levelNames(command<Levels>(f, 'levels')),
      'A and B, then C and D, then E',
    ).toEqual([
      { level: 1, packages: ['A', 'B'] },
      { level: 2, packages: ['C', 'D'] },
      { level: 3, packages: ['E'] },
    ]);
    extension = await load(installed);
    allowed(
      await extension.fire('tool_call', handoff(['A', 'B'], 'level-one')),
    );
    await refused(handoff(['C', 'D'], 'too-soon'), 'C');
    returned('A');
    await refused(handoff(['C', 'D'], 'only-A-returned'), 'D');
    returned('B');
    allowed(
      await extension.fire('tool_call', handoff(['C', 'D'], 'level-two')),
    );
    await refused(handoff(['E'], 'before-C-D-return'), 'E');
    returned('D');
    await refused(handoff(['E'], 'only-D-returned'), 'E');
    returned('C');
    allowed(await extension.fire('tool_call', handoff(['E'], 'level-three')));
  });
  it('Example 8 — no ready package is a refusal, not an empty dispatch', async () => {
    examples(f, [example(1, 'delivery')]);
    bound(1);
    extension = await load(installed);
    const missing = task(
      'builder',
      {
        cut,
        workPackage: 'delivery',
        outputs: ['delivery.txt'],
        concepts: ['delivery'],
        examples: ['booking/1'],
      },
      'empty-cut',
    );
    await refused(missing, 'delivery');
    submit(f, 'delivery', ['delivery']);
    allowed(
      await extension.fire(
        'tool_call',
        handoff(['delivery'], 'delivery-start'),
      ),
    );
    await refused(handoff(['delivery'], 'already-dispatched'), 'delivery');
    returned('delivery');
    await refused(handoff(['delivery'], 'already-returned'), 'delivery');
  });
  it.each(['dispatch', 'finish', 'run'])(
    '0083 retirement — work package capability no longer offers %s',
    async (verb) => {
      extension = await load(installed);
      const capability = extension.tools.find(
        (tool) => tool.name === 'work_package',
      );
      expect(
        capability,
        'the delivered work package capability remains available',
      ).toBeDefined();
      const verbs = capability!.parameters.properties.verb.enum;
      expect(verbs, `retired agent-called ${verb} is absent`).not.toContain(
        verb,
      );
    },
  );
});
