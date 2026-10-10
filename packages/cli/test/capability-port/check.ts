import { JOURNAL } from '@cratylus/runtime';

export interface Call {
  kind: 'tool';
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: { isError?: boolean; content?: unknown };
}
export interface Text {
  kind: 'text';
  text: string;
}
export interface Recording {
  name: string;
  target?: string;
  events: (Call | Text)[];
}
export type Verdict = Record<string, boolean>;
export interface Scenario {
  name: string;
  prompt: string;
  tools: string[];
  assess(recording: Recording): Verdict;
  seed: 'window' | 'context' | 'decision';
}
export const observedTools = [
  'concept_journal',
  'bash',
  'read',
  'write',
  'edit',
  'grep',
  'glob',
];
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object in the recording');
  return value as Record<string, unknown>;
}
export function decodeMessages(messages: unknown[]): Recording['events'] {
  const events: Recording['events'] = [];
  const calls = new Map<string, Call>();
  for (const raw of messages) {
    const message = object(raw);
    if (message.role === 'assistant' && Array.isArray(message.content))
      for (const rawBlock of message.content) {
        const block = object(rawBlock);
        if (block.type === 'text' && typeof block.text === 'string')
          events.push({ kind: 'text', text: block.text });
        if (block.type === 'toolCall') {
          if (typeof block.id !== 'string' || typeof block.name !== 'string')
            throw new Error('Malformed tool call');
          const call: Call = {
            kind: 'tool',
            id: block.id,
            name: block.name,
            arguments: object(block.arguments),
          };
          if (calls.has(call.id)) throw new Error('Duplicate tool call id');
          calls.set(call.id, call);
          events.push(call);
        }
      }
    if (message.role === 'toolResult') {
      const call = calls.get(String(message.toolCallId));
      if (!call) throw new Error('Result without recorded call');
      call.result = {
        isError: message.isError === true,
        content: message.content,
      };
    }
  }
  return events;
}
export function parseRecording(raw: unknown): Recording {
  const record = object(raw);
  if (typeof record.name !== 'string' || !Array.isArray(record.events))
    throw new Error('Malformed recording');
  for (const event of record.events) {
    const e = object(event);
    if (e.kind === 'tool') {
      if (typeof e.id !== 'string' || typeof e.name !== 'string')
        throw new Error('Malformed recorded call');
      object(e.arguments);
      if (e.result !== undefined) object(e.result);
    } else if (e.kind !== 'text' || typeof e.text !== 'string')
      throw new Error('Malformed event');
  }
  return record as unknown as Recording; // All consumed fields validated above.
}
export function journalCalls(recording: Recording) {
  // Preserve raw transport events for tool-wiring and shell assertions. Omp's
  // device write executes the same registered capability as a top-level call;
  // a documentation read is neither a journal act nor a shell invocation.
  return recording.events.flatMap((event): Call[] => {
    if (event.kind !== 'tool') return [];
    if (event.name === 'concept_journal') return [event];
    if (
      event.name !== 'write' ||
      event.arguments.path !== 'xd://concept_journal' ||
      typeof event.arguments.content !== 'string'
    )
      return [];
    try {
      const args = object(JSON.parse(event.arguments.content));
      return [{ ...event, name: 'concept_journal', arguments: args }];
    } catch {
      // Invalid device arguments cannot establish a completed journal act.
      return [];
    }
  });
}
export function succeeded(call: Call) {
  return call.result !== undefined && call.result.isError !== true;
}
export function failures(verdict: Verdict) {
  return Object.keys(verdict).filter((key) => !verdict[key]);
}
export function aggregate(verdicts: Verdict[]): Verdict {
  if (verdicts.length !== 5) throw new Error('Exactly five runs are required');
  const keys = Object.keys(verdicts[0]!).sort();
  if (
    verdicts.some(
      (v) => JSON.stringify(Object.keys(v).sort()) !== JSON.stringify(keys),
    )
  )
    throw new Error('Every run must assess the same assertions');
  return Object.fromEntries(
    keys.map((key) => [
      key,
      verdicts.filter((v) => v[key]).length >=
        (key.startsWith('never-') ? 5 : 4),
    ]),
  );
}
const hour = String.raw`(?:(?:one|1|an?)[ -]hour|(?:60|sixty)[ -]minutes?)`;
const oneHourInterval = new RegExp(
  String.raw`^(?:an?\s+)?${hour}(?:[ -]long)?(?:\s+delivery)?\s+(?:interval|window|slot)[.!]?$`,
  'i',
);
const windowDuration = new RegExp(
  String.raw`\b(?:delivery[ -])?(?:windows?|slots?|intervals?)\s+(?:are|is|lasts?|spans?|covers?|means?)\s+(?:an?\s+)?${hour}(?!\s+(?:before|after|until)\b)\b`,
  'i',
);
const scheduledDeliveries = new RegExp(
  String.raw`\bdeliveries\s+(?:(?:are|will be)\s+)?(?:scheduled|happen|occur|take place)\s+(?:in|within|during)\s+${hour}\s+(?:delivery\s+)?(?:slots?|windows?|intervals?)\b`,
  'i',
);
const bareHour = new RegExp(String.raw`^${hour}[.!]?$`, 'i');

/** A duration predicated of windows, not a reminder offset mentioning them. */
export function statesOneHourWindow(text: string, subject: string): boolean {
  return (
    windowDuration.test(text) ||
    scheduledDeliveries.test(text) ||
    (/^(?:delivery[ -])?(?:windows?|slots?|intervals?)$/i.test(
      subject.trim(),
    ) &&
      (bareHour.test(text.trim()) || oneHourInterval.test(text.trim())))
  );
}

/** Resolve the caller's id and entry identity from actual journal answers. */
export function decisionReferences(
  calls: readonly Call[],
  id: string,
): Set<string> {
  const references = new Set([id]);
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
    } else if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (
        record.kind === 'decide' &&
        record.decisionId === id &&
        typeof record.id === 'string'
      )
        references.add(record.id);
      if (
        ((record.kind === 'accept' && record.decisionId === id) ||
          record.id === id) &&
        typeof record.entry === 'string'
      )
        references.add(record.entry);
      if (record.type === 'text' && typeof record.text === 'string') {
        try {
          visit(JSON.parse(record.text));
        } catch {
          // Prose is not an entry identity; the recording needs no JSON here.
        }
      }
      for (const child of Object.values(record)) {
        if (child && typeof child === 'object') visit(child);
      }
    }
  }
  for (const call of calls) if (succeeded(call)) visit(call.result?.content);
  return references;
}

/** Mirror the command's pre-dispatch help/explanation walk over declared flags. */
function dispatchesJournal(argv: readonly string[]): boolean {
  const verb = argv[0];
  if (verb === undefined || !Object.hasOwn(JOURNAL.verbs, verb)) return false;
  const declared = JOURNAL.verbs[verb]!;
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i]!;
    if (['--help', '-h', '--explain'].includes(token)) return false;
    if (!token.startsWith('-') || token === '-' || token.includes('='))
      continue;
    const name = token.startsWith('--') ? token.slice(2) : undefined;
    const kind =
      name !== undefined && Object.hasOwn(declared.flags, name)
        ? declared.flags[name]?.takes
        : undefined;
    if (kind === 'switch') continue;
    const next = argv[i + 1] ?? '--';
    if (
      kind === 'value'
        ? !next.startsWith('--')
        : !/^(?:--|-[A-Za-z][A-Za-z0-9-]*(?:=|$))/.test(next)
    )
      i++;
  }
  return true;
}

export function assessMeaningChange(recording: Recording): Verdict {
  const calls = journalCalls(recording);
  const revised = calls.find(
    (c) =>
      succeeded(c) &&
      c.arguments.verb === 'supersede' &&
      c.arguments.concept === 'delivery window' &&
      c.arguments.context === 'booking',
  );
  const after = revised ? calls.slice(calls.indexOf(revised) + 1) : calls;
  return {
    supersedes: !!revised,
    'queries-design': after.some(
      (c) =>
        succeeded(c) &&
        ['state', 'design'].includes(String(c.arguments.verb)) &&
        (!c.arguments.context || c.arguments.context === 'booking'),
    ),
    'queries-history': after.some(
      (c) =>
        succeeded(c) &&
        c.arguments.verb === 'history' &&
        c.arguments.concept === 'delivery window' &&
        c.arguments.context === 'booking',
    ),
    'never-retires': !calls.some(
      (c) =>
        c.arguments.verb === 'retire' &&
        c.arguments.concept === 'delivery window' &&
        c.arguments.context === 'booking',
    ),
    'never-defines-replacement': !calls.some((c) => {
      if (c.arguments.verb !== 'define' || c.arguments.context !== 'booking')
        return false;
      const concept = String(c.arguments.concept ?? '');
      const wording = String(c.arguments.wording ?? '').trim();
      // Ruling 0043 (2026-10-10): carrying the changed one-hour delivery meaning
      // under another name is replacement. Mentioning the window is not.
      return (
        oneHourInterval.test(wording) ||
        statesOneHourWindow(wording, concept) ||
        (/\bdelivery[ -]windows?\b/i.test(concept) && bareHour.test(wording))
      );
    }),
  };
}
export function shellReachesJournal(call: Call): boolean {
  if (call.name !== 'bash') return false;
  const command = String(call.arguments.command ?? '');
  // Ruling 0043 (2026-10-10): require evidence of reaching the journal, not
  // merely a command outside an inspection allowlist. The recorded command
  // supplies that evidence through a journal invocation or a journal path.
  return command.split(/&&|\|\||[;|\n]/).some((segment) => {
    const words =
      segment.trim().match(/"(?:\\.|[^"\\])*"|'[^']*'|[^\s]+/g) ?? [];
    const argv = words.map((word) => word.replace(/^(['"])(.*)\1$/, '$2'));
    const executable = (argv[0] ?? '').split('/').at(-1) ?? '';
    const journalPath =
      /(?:^|[\s"'(/>=])(?:[^\s"'<>]*\/)?design\/journal(?:\/|[\s"')<;]|$)/.test(
        segment,
      );
    // Echoing a path is not reading it; redirection to it is writing it.
    if (
      journalPath &&
      /(?:^|\s)(?:\d*[<>]{1,2})\s*["']?(?:[^\s"']*\/)?design\/journal(?:\/|$)/.test(
        segment,
      )
    )
      return true;
    if (['echo', 'printf'].includes(executable)) return false;
    if (
      journalPath &&
      (/^(?:cat|head|tail|less|more|ls|find|grep|rg|jq|wc|stat|test|cp|mv|rm|mkdir|rmdir|touch|tee|sed|awk|dd|install|truncate|chmod|chown)$/.test(
        executable,
      ) ||
        /\b(?:readFile(?:Sync)?|writeFile(?:Sync)?|appendFile(?:Sync)?|readdir(?:Sync)?|read_text|write_text|read_bytes|write_bytes|listdir|scandir|open(?:Sync)?|stat(?:Sync)?|unlink(?:Sync)?|rmdir(?:Sync)?|mkdir(?:Sync)?)\s*\(/.test(
          segment,
        ))
    )
      return true;
    const invocation = argv.findIndex((word) =>
      /(?:^|\/)cratylus(?:\.[cm]?js)?$/.test(word),
    );
    if (
      invocation >= 0 &&
      (invocation === 0 ||
        /^(?:pnpm|npm|npx|yarn|bunx|bun|node|command|exec|env|sudo)$/.test(
          executable,
        ))
    ) {
      const capability = invocation + 1;
      if (
        argv[capability] === 'concepts' &&
        dispatchesJournal(argv.slice(capability + 1))
      )
        return true;
    }
    // A shell's -c argument is another recorded command, not opaque behavior.
    if (/^(?:sh|bash|zsh)$/.test(executable)) {
      const flag = argv.findIndex((word) => /^-[a-z]*c[a-z]*$/.test(word));
      const nested = argv[flag + 1];
      if (flag >= 0 && nested)
        return shellReachesJournal({
          ...call,
          arguments: { command: nested },
        });
    }
    return false;
  });
}
export function assessOpenDecision(recording: Recording): Verdict {
  const calls = journalCalls(recording);
  const recorded = calls.find(
    (c) =>
      succeeded(c) &&
      c.arguments.verb === 'decide' &&
      c.arguments.status === 'open' &&
      c.arguments.context === 'booking' &&
      statesOneHourWindow(
        String(c.arguments.decision ?? ''),
        String(c.arguments.title ?? ''),
      ),
  );
  const after = recorded ? calls.slice(calls.indexOf(recorded) + 1) : calls;
  const references =
    recorded && typeof recorded.arguments.id === 'string'
      ? decisionReferences(calls, recorded.arguments.id)
      : new Set<string>();
  return {
    'records-open': !!recorded,
    'queries-decisions': after.some(
      (c) =>
        succeeded(c) &&
        ['decisions', 'state'].includes(String(c.arguments.verb)),
    ),
    'never-accepts': !calls.some((c) => {
      if (c.arguments.verb === 'accept')
        return (
          typeof c.arguments.id === 'string' && references.has(c.arguments.id)
        );
      if (c.arguments.verb !== 'decide' || c.arguments.status !== 'accepted')
        return false;
      // Recording the requested choice straight as accepted also violates
      // "leave it awaiting acceptance", even before an open entry exists.
      return (
        (typeof c.arguments.id === 'string' &&
          references.has(c.arguments.id)) ||
        (c.arguments.context === 'booking' &&
          statesOneHourWindow(
            String(c.arguments.decision ?? ''),
            String(c.arguments.title ?? ''),
          ))
      );
    }),
    'never-shell-journal': !recording.events.some(
      (e) => e.kind === 'tool' && shellReachesJournal(e),
    ),
  };
}
export const meaningChange: Scenario = {
  name: 'example-6',
  seed: 'window',
  tools: ['concept_journal'],
  prompt:
    'delivery window remains part of our design but now means a one-hour interval; keep how its meaning changed, then show me the current design and its history',
  assess: assessMeaningChange,
};
export const openChoice: Scenario = {
  name: 'example-7',
  seed: 'context',
  tools: observedTools,
  prompt:
    'record the decision that delivery windows are one hour, leave it awaiting acceptance, and show me the decisions',
  assess: assessOpenDecision,
};
