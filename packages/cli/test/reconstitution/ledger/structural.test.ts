// Binds workflow/reconstitution 4–13, 25–28; contract sections 2–4 and 10.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Inventory } from '../../execution/fixture.js';
import {
  type ExecutionFixture,
  builder,
  commit,
  completionHook,
  entries,
  examples,
  fixture,
  git,
  ledger,
  lifecycle,
  ok,
  open,
  pair,
  returnedPair,
  run,
  state,
  statuses,
  verdict,
  wp,
  write,
} from './fixture.js';
let f: ExecutionFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => {
  f.dispose();
});

describe('reconstitution: ledger and cut', () => {
  it('workflow/4 — harness dispatch and return put the cut in flight, not approved', () => {
    pair(f);
    builder(f, 'shoot', 'dispatched');
    expect(state(f).phase, 'in flight from the first dispatch').toBe(
      'in flight',
    );
    expect(
      statuses(state(f)).shoot,
      'records dispatched from those events',
    ).toBe('dispatched');
    builder(f, 'shoot', 'returned');
    expect(
      statuses(state(f)).shoot,
      'never calls returned approved merely because its builder is finished',
    ).toBe('returned');
    expect(
      entries(f)
        .filter(
          (e) =>
            e.workPackage === 'shoot' &&
            ['dispatched', 'returned'].includes(String(e.kind)),
        )
        .map((e) => e.kind),
      'records dispatched and returned from those events',
    ).toEqual(['dispatched', 'returned']);
  });
  it('workflow/5 — two independent approvals complete only after every package is approved', () => {
    returnedPair(f);
    verdict(f, 'first', { shoot: true, edit: true });
    verdict(f, 'second', { shoot: true });
    expect(statuses(state(f)), 'only one work package approved').toEqual({
      shoot: 'approved',
      edit: 'returned',
    });
    expect(state(f).phase, 'one approved package never reports complete').toBe(
      'in flight',
    );
    verdict(f, 'second', { shoot: true, edit: true }, 'film', 'second-final');
    expect(
      statuses(state(f)),
      'their approvals appear without agent recording calls',
    ).toEqual({ shoot: 'approved', edit: 'approved' });
    expect(state(f).phase, 'complete once both are approved').toBe('complete');
  });
  it('workflow/6 — repeated transition is refused without rewriting or changing state', () => {
    pair(f);
    const event = {
      kind: 'dispatched',
      transition: 'unique-dispatch',
      cut: 'film',
      workPackage: 'shoot',
      role: 'builder',
      run: 'shoot-run',
    };
    lifecycle(f, event);
    const before = ledger(f);
    const answer = state(f);
    const repeated = run(f, 'lifecycle', JSON.stringify(event));
    expect(repeated.code, 'the repeat is refused').not.toBe(0);
    expect(
      repeated.stderr + repeated.stdout,
      'refusal names its own transition id',
    ).toContain(event.transition);
    expect(ledger(f), 'original remains and no duplicate is recorded').toEqual(
      before,
    );
    expect(state(f), 'no additional state change').toEqual(answer);
  });
  it('workflow/7 — each request computes phase, statuses and readiness from current events', () => {
    pair(f);
    const earlier = state(f);
    expect(earlier.phase, 'phase computed before dispatch').toBe('open');
    expect(statuses(earlier), 'both package statuses').toEqual({
      shoot: 'submitted',
      edit: 'submitted',
    });
    expect(
      earlier.ready,
      'edit never offered with unfinished dependency',
    ).toEqual(['shoot']);
    builder(f, 'shoot', 'dispatched');
    expect(state(f).ready, 'dispatched is not finished').not.toContain('edit');
    builder(f, 'shoot', 'returned');
    const later = state(f);
    expect(later.phase, 'current phase').toBe('in flight');
    expect(statuses(later), 'current statuses').toEqual({
      shoot: 'returned',
      edit: 'submitted',
    });
    expect(
      later.ready,
      'next dispatchable package after shoot finished',
    ).toEqual(['edit']);
    const beforeRead = ledger(f);
    expect(
      state(f),
      'stale earlier answer never replaces computed state',
    ).toEqual(later);
    expect(ledger(f), 'readiness is computed, not stored').toEqual(beforeRead);
  });
  it('workflow/8 — branch-local ledger and journal entries arrive only with their merge', () => {
    write(f, 'base.txt', 'integration baseline\n');
    git(f.root, 'add', 'base.txt');
    git(f.root, 'commit', '-m', 'test: baseline');
    git(f.root, 'switch', '-c', 'feature/film');
    ok(f, 'concepts', 'context', 'workflow', '--subject', 'Film production');
    ok(
      f,
      'concepts',
      'define',
      'shoot',
      '--context',
      'workflow',
      '--wording',
      'The takes of the film.',
      '--reason',
      'Film cut',
    );
    pair(f);
    builder(f, 'shoot', 'dispatched');
    ok(
      f,
      'concepts',
      'decide',
      'film-choice',
      '--context',
      'workflow',
      '--title',
      'Accept film',
      '--situation',
      'A film is needed',
      '--decision',
      'Make the film',
      '--consequences',
      'Film work',
      '--status',
      'open',
    );
    ok(f, 'concepts', 'accept', 'film-choice');
    const featureLedger = ledger(f);
    const featureDesign = JSON.parse(ok(f, 'concepts', 'state'));
    expect(state(f).phase, 'feature branch shows dispatch').toBe('in flight');
    git(f.root, 'add', 'design');
    git(f.root, 'commit', '-m', 'test: film records');
    git(f.root, 'switch', 'journal');
    expect(
      ledger(f),
      'integration does not claim feature events on the same checkout and home',
    ).toEqual({});
    const absent = run(f, 'workPackage', 'state', '--cut', 'film');
    expect(
      absent.stdout,
      'integration never claims feature dispatch',
    ).not.toContain('in flight');
    expect(
      ok(f, 'concepts', 'state'),
      'integration has not accepted film-choice',
    ).not.toContain('film-choice');
    git(f.root, 'merge', '--ff-only', 'feature/film');
    expect(ledger(f), 'entries land with work').toEqual(featureLedger);
    expect(
      JSON.parse(ok(f, 'concepts', 'state')),
      'concept changes and acceptance land with merge',
    ).toEqual(featureDesign);
    expect(state(f).phase, 'merged branch now holds dispatch').toBe(
      'in flight',
    );
  });
  it('workflow/9 — a builder retrospective message cannot create a harness return', () => {
    pair(f);
    builder(f, 'shoot', 'dispatched');
    const before = ledger(f);
    write(
      f,
      'builder-message.txt',
      'My shoot work package returned and is finished.',
    );
    expect(
      statuses(state(f)).shoot,
      'statement alone never creates a return',
    ).toBe('dispatched');
    expect(
      entries(f).filter((e) => e.kind === 'returned'),
      'lifecycle state comes from harness events',
    ).toEqual([]);
    expect(
      ledger(f),
      'retrospective account writes no lifecycle state',
    ).toEqual(before);
  });
  it('workflow/25 — one assayer cannot approve for both assayers', () => {
    returnedPair(f);
    verdict(f, 'first', { shoot: true, edit: true });
    expect(
      statuses(state(f)),
      'one passing verdict leaves each package unapproved',
    ).toEqual({ shoot: 'returned', edit: 'returned' });
    expect(state(f).phase, 'cut remains incomplete').toBe('in flight');
    verdict(
      f,
      'first',
      { shoot: true, edit: true },
      'film',
      'same-assayer-again',
    );
    expect(
      statuses(state(f)),
      'two runs from one identity are not two independent assayers',
    ).toEqual({ shoot: 'returned', edit: 'returned' });
  });
  it('workflow/26 — agreeing findings return edit to build while shoot is approved', () => {
    returnedPair(f);
    for (const assayer of ['first', 'second'])
      verdict(f, assayer, { shoot: true, edit: false });
    expect(
      statuses(state(f)),
      'edit returns to build as a failing case, shoot approved',
    ).toEqual({ shoot: 'approved', edit: 'failing' });
    expect(
      state(f).phase,
      'both returned verdicts never complete an unapproved cut',
    ).toBe('in flight');
    builder(f, 'edit', 'dispatched', 'film', 'edit-repair');
    expect(statuses(state(f)).edit, 'failing case returns to its builder').toBe(
      'dispatched',
    );
  });
  it('workflow/27 — one architect records one cut with separate context models and example sets', () => {
    const contexts = ['workflow', 'agents', 'delivery'];
    examples(f, 'film', contexts);
    const opened = run(
      f,
      'workPackage',
      'open',
      '--cut',
      'film',
      '--branch',
      'feature/film',
      ...contexts.flatMap((context) => ['--architect', `${context}=creative`]),
    );
    const answer = state(f);
    expect(
      answer.architects,
      'each context is held by the same architect, with no separate approver',
    ).toEqual({
      workflow: 'creative',
      agents: 'creative',
      delivery: 'creative',
    });
    expect(
      opened.code,
      `one architect can open the shared cut without a separate approver: ${opened.stderr}${opened.stdout}`,
    ).toBe(0);
    expect(answer.cut, 'one cut, never three cuts').toBe('film');
    expect(
      [...answer.contexts].sort(),
      'examples kept in each own context',
    ).toEqual([...contexts].sort());
    expect(
      entries(f).filter((e) => e.kind === 'cut'),
      'one recorded cut',
    ).toHaveLength(1);
    const inventory = wp<Inventory>(f, 'film', 'inventory');
    expect(
      inventory.examples.map((e) => e.ref).sort(),
      'shared cut never merges example sets with identical numbers',
    ).toEqual(
      contexts.flatMap((context) => [`${context}/1`, `${context}/2`]).sort(),
    );
    expect(
      inventory.concepts,
      'three context models, never one merged model',
    ).toHaveLength(6);
    for (const context of contexts) {
      expect(
        inventory.concepts,
        'each concept stays in its own context',
      ).toEqual(
        expect.arrayContaining([
          { context, name: 'shoot', servedBy: [] },
          { context, name: 'edit', servedBy: [] },
        ]),
      );
    }
  });
  it('workflow/28 — different or missing architects refuse one cross-context cut without recording it', () => {
    examples(f, 'film', ['film-production', 'scheduling']);
    const before = ledger(f);
    const refused = run(
      f,
      'workPackage',
      'open',
      '--cut',
      'film',
      '--branch',
      'feature/film',
      '--architect',
      'film-production=creative',
      '--architect',
      'scheduling=planner',
    );
    expect
      .soft(
        refused.code,
        'different architects require one cut per context, never convenience',
      )
      .not.toBe(0);
    const reason = refused.stderr + refused.stdout;
    for (const word of ['film-production', 'scheduling', 'creative', 'planner'])
      expect
        .soft(reason, 'names both contexts and both architects')
        .toContain(word);
    expect
      .soft(reason, 'names the architects whose contexts cannot share a cut')
      .toMatch(/architect/i);
    expect
      .soft(reason, 'one cut per context joined by contracts')
      .toMatch(/contract/i);
    expect
      .soft(reason, 'one cut per context')
      .toMatch(/one cut (?:per|for each) context/i);
    expect.soft(ledger(f), 'refused cut not recorded').toEqual(before);
    const missing = run(
      f,
      'workPackage',
      'open',
      '--cut',
      'film',
      '--branch',
      'feature/film',
      '--architect',
      'film-production=creative',
    );
    expect
      .soft(missing.code, 'a context without an architect is refused')
      .not.toBe(0);
    const missingReason = missing.stderr + missing.stdout;
    expect
      .soft(missingReason, 'names the context without an architect')
      .toContain('scheduling');
    expect
      .soft(missingReason, 'an architect is never assumed')
      .toMatch(/architect/i);
    expect
      .soft(missingReason, 'missing architect is never assumed')
      .toMatch(/never assumed/i);
    expect
      .soft(ledger(f), 'missing architect refusal writes nothing')
      .toEqual(before);
    // Approval by each architect and reviewable size require judgment, not a ledger field.
  });
});

describe('reconstitution: real post-commit completion check', () => {
  it('workflow/10 — a complete cut commit is silent and never refused', () => {
    returnedPair(f);
    for (const assayer of ['first', 'second'])
      verdict(f, assayer, { shoot: true, edit: true });
    expect(state(f).phase, 'ledger shows complete').toBe('complete');
    completionHook(f);
    const before = ledger(f);
    expect(
      commit(f, 'feat(cut:film): complete the film cut'),
      'completion check is silent',
    ).toBe('');
    expect(ledger(f), 'completion check never writes ledger').toEqual(before);
  });
  it('workflow/11 — incomplete declaration warns of edit, not approved shoot, without changing ledger', () => {
    returnedPair(f);
    for (const assayer of ['first', 'second'])
      verdict(f, assayer, { shoot: true });
    completionHook(f);
    const before = ledger(f);
    const warning = commit(f, 'feat(cut:film): complete the film cut');
    for (const word of ['film', state(f).phase, 'edit'])
      expect(
        warning,
        'names cut, computed phase and unapproved edit',
      ).toContain(word);
    expect(warning, 'never lists approved shoot as unapproved').not.toContain(
      'shoot',
    );
    expect(warning, 'instructs author to report the gap as a defect').toMatch(
      /report[\s\S]*defect/i,
    );
    expect(warning, 'defect in capture of harness events').toMatch(
      /harness[\s\S]*event|event[\s\S]*harness/i,
    );
    expect(
      ledger(f),
      'never silently changes ledger to match declaration',
    ).toEqual(before);
  });
  it.each([
    'docs(design): explain completion',
    'fix: finish the cut',
    'feat(film): complete the film cut',
  ])('workflow/12 — ordinary commit is silent: %s', (message) => {
    pair(f);
    completionHook(f);
    const before = ledger(f);
    expect(commit(f, message), 'outside enumerated form remains silent').toBe(
      '',
    );
    expect(ledger(f), 'ordinary commits never become ledger events').toEqual(
      before,
    );
  });
  it('workflow/13 — watched scope warns even without a completion keyword', () => {
    pair(f);
    completionHook(f);
    const before = ledger(f);
    const warning = commit(f, 'feat(cut:film): deliver film review');
    expect(warning, 'does not require additional completion keyword').toContain(
      'film',
    );
    expect(warning, 'compares with computed ledger phase').toContain(
      state(f).phase,
    );
    expect(warning, 'warns of incomplete packages').toContain('edit');
    expect(ledger(f), 'warning never records completion').toEqual(before);
  });
});
