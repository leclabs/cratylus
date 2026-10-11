import { descend, pastObjective } from '@cratylus/canon';

export interface HeldDrift {
  // Several guards can jointly refuse one attempt.
  guard: string | string[];
  attempt: 'call';
  tool?: string;
  input?: unknown;
  reason: string;
}

export interface RelayedTell {
  guard: string;
  text: string;
  reason: string;
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .flatMap((block) => {
      const item = object(block);
      return item?.type === 'text' && typeof item.text === 'string'
        ? [item.text]
        : [];
    })
    .join('\n');
}
// Retained turn-end notices are diagnostic only: their replies already took
// effect (0106). These historical sentences are not installed guard definitions.
function replyGuard(reason: string): string | undefined {
  if (
    reason.startsWith('burying: this reply buries its bottom line.') ||
    reason.startsWith('burying: this turn buries its bottom line.')
  )
    return 'bottom-line';
  if (
    reason.startsWith(
      'hand-back: this reply returns a decision you own to the operator.',
    )
  )
    return 'hand-back';
  if (reason.startsWith('unrecorded:')) return 'unrecorded';
  return undefined;
}
// The first sentence identifies a pre-act refusal independently of its tail.
const descendPrefix = descend.refusal.slice(
  0,
  descend.refusal.indexOf('.') + 1,
);
const pastObjectivePrefix = pastObjective.refusal.slice(
  0,
  pastObjective.refusal.indexOf('.') + 1,
);

// Non-exported generated refusal sentences live in forge/src/adapters/omp/render.ts:
// READBACK_REFUSAL, READBACK_UNSEEN_REFUSAL, EVAL_DISPATCH_REFUSAL, leadRefusal,
// builderRefusal, before_subagent_spawn and the task tool_call handler. The latter uses
// schema/src/contract.ts checkAssignment.
// Match only those leading sentences, not arbitrary command errors or mentions.
function refusingGuard(reason: string): string | undefined {
  if (reason.startsWith(descendPrefix)) return descend.id;
  if (reason.startsWith(pastObjectivePrefix)) return pastObjective.id;
  if (
    reason.startsWith(
      'reconstitution: give the operator the readback (current design, open decisions, cuts in flight) ',
    )
  )
    return 'readback-gate';
  if (
    reason.startsWith(
      'dispatch: dispatch a delegate with the task tool, where its assignment is checked.',
    )
  )
    return 'eval-dispatch';
  if (/^lead dispatch of cut .+ refused: /.test(reason)) return 'lead-dispatch';
  if (/^builder dispatch of cut .+ refused: /.test(reason))
    return 'builder-dispatch';
  if (/^\S+ assignment is (?:missing|ill-typed): /.test(reason))
    return 'typed-handoff';
  if (/^Cannot spawn '[^']+'. Allowed: /.test(reason)) return 'spawn-policy';
  return undefined;
}

/** 0106: only refused pre-act attempts are withheld from delivered evidence. */
export function deliveredEvidence(messages: readonly unknown[]): {
  delivered: unknown[];
  heldDrift: HeldDrift[];
  relayed: RelayedTell[];
} {
  const removedMessages = new Set<number>();
  const removedBlocks = new Map<number, Set<number>>();
  const calls = new Map<
    string,
    { message: number; block: number; call: Record<string, unknown> }
  >();
  const heldDrift: HeldDrift[] = [];
  const relayed: RelayedTell[] = [];
  let relayReply = '';
  const removeBlock = (message: number, block: number) => {
    let blocks = removedBlocks.get(message);
    if (!blocks) {
      blocks = new Set();
      removedBlocks.set(message, blocks);
    }
    blocks.add(block);
  };
  for (const [index, value] of messages.entries()) {
    const message = object(value);
    if (!message) continue;
    const relayReason = message.role === 'user' ? textOf(message.content) : '';
    const relayGuard = replyGuard(relayReason);
    if (
      message.role === 'user' &&
      message.steering === true &&
      message.attribution === 'agent' &&
      relayGuard
    ) {
      // Historical steering notices remain evidence alongside the reply.
      // Several notices can concern the same preceding reply.
      if (relayReply)
        relayed.push({
          guard: relayGuard,
          text: relayReply,
          reason: relayReason,
        });
      continue;
    }
    relayReply = message.role === 'assistant' ? textOf(message.content) : '';
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const [block, value] of message.content.entries()) {
        const call = object(value);
        if (call?.type === 'toolCall' && typeof call.id === 'string')
          calls.set(call.id, { message: index, block, call });
      }
    }
    const callRefusal =
      message.role === 'toolResult' && message.isError === true;
    if (!callRefusal) continue;
    const reason = textOf(message.content);
    if (!refusingGuard(reason)) continue;
    // One pre-act result may name several refusing guards.
    const guards = [
      ...new Set(
        reason.split(/\n+/).flatMap((line) => {
          const guard = refusingGuard(line);
          return guard ? [guard] : [];
        }),
      ),
    ];
    const guard = guards.length === 1 ? guards[0]! : guards;
    const id = message.toolCallId;
    const previous = typeof id === 'string' ? calls.get(id) : undefined;
    // A result without its attempted call cannot establish a refused attempt.
    if (!previous) continue;
    removeBlock(previous.message, previous.block);
    removedMessages.add(index);
    calls.delete(id as string);
    heldDrift.push({
      guard,
      attempt: 'call',
      tool:
        typeof previous.call.name === 'string' ? previous.call.name : undefined,
      input: previous.call.arguments,
      reason,
    });
  }
  const delivered = messages.flatMap((value, index) => {
    if (removedMessages.has(index)) return [];
    const blocks = removedBlocks.get(index);
    if (!blocks) return [value];
    const message = object(value)!;
    const content = (message.content as unknown[]).filter(
      (_, block) => !blocks.has(block),
    );
    return content.length ? [{ ...message, content }] : [];
  });
  return { delivered, heldDrift, relayed };
}

export interface HeldDriftCount {
  total: number;
  byGuard: Record<string, number>;
}

export function countHeldDrift(run: unknown): HeldDriftCount {
  const entries = object(run)?.heldDrift;
  const byGuard: Record<string, number> = {};
  let total = 0;
  if (Array.isArray(entries)) {
    for (const value of entries) {
      const entry = object(value);
      if (entry?.attempt !== 'call') continue;
      const guard = entry.guard;
      const guards = typeof guard === 'string' ? [guard] : guard;
      if (!Array.isArray(guards) || guards.length === 0) continue;
      for (const name of new Set(guards))
        if (typeof name === 'string') byGuard[name] = (byGuard[name] ?? 0) + 1;
      total++;
    }
  }
  return { total, byGuard };
}

export function totalHeldDrift(
  counts: readonly HeldDriftCount[],
): HeldDriftCount {
  const byGuard: Record<string, number> = {};
  let total = 0;
  for (const count of counts) {
    total += count.total;
    for (const [guard, number] of Object.entries(count.byGuard))
      byGuard[guard] = (byGuard[guard] ?? 0) + number;
  }
  return { total, byGuard };
}
