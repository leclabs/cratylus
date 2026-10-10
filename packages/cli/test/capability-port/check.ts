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
      // Ruling 0043 (2026-10-10): "in its place" is observed when a definition
      // names delivery window or gives its new one-hour-interval meaning under
      // another name. An unrelated definition (even in booking) is not a failure.
      return (
        /\bdelivery[ -]windows?\b/i.test(`${concept} ${wording}`) ||
        /^(?:a[n]?\s+)?(?:(?:one|1|an?)[ -]hour|(?:60|sixty)[ -]minutes?)(?:[ -]long)?(?:\s+interval)?[.!]?$/i.test(
          wording,
        )
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
        )) &&
      argv.slice(invocation + 1).includes('concepts')
    )
      return true;
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
      c.arguments.status === 'open',
  );
  const after = recorded ? calls.slice(calls.indexOf(recorded) + 1) : calls;
  return {
    'records-open': !!recorded,
    'queries-decisions': after.some(
      (c) =>
        succeeded(c) &&
        ['decisions', 'state'].includes(String(c.arguments.verb)),
    ),
    'never-accepts': !calls.some(
      (c) =>
        recorded !== undefined &&
        c.arguments.id === recorded.arguments.id &&
        (c.arguments.verb === 'accept' ||
          (c.arguments.verb === 'decide' && c.arguments.status === 'accepted')),
    ),
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
