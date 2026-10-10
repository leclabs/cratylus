// Pure assessor shared by the no-model controls and omp's observer. Only the
// journal tool's own explanation may introduce cratylus to a plain subject.
// Architect ruling 0043 (2026-10-10): these are Given preconditions. Failure
// invalidates a run; it is not an assertion that the agent behaved wrongly.
export interface IsolationWiring {
  systemPrompt: string[];
  active: string[];
  tools: {
    name: string;
    description: string;
    label?: string;
    parameters: unknown;
  }[];
  memory?: { backend: string; active: boolean };
}
export function assessIsolation(
  wiring: IsolationWiring,
  expectedTools: string[],
) {
  const prompt = wiring.systemPrompt.join('\n');
  let outsideExplanation = prompt.replace(/\s+/g, ' ');
  const tool = wiring.tools.find((t) => t.name === 'concept_journal');
  if (tool) {
    const explanation: string[] = [tool.description, tool.label ?? ''];
    function descriptions(value: unknown) {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (key === 'description' && typeof child === 'string')
          explanation.push(child);
        else descriptions(child);
      }
    }
    descriptions(tool.parameters);
    for (const text of explanation
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)) {
      for (const rendered of [text, JSON.stringify(text).slice(1, -1)])
        outsideExplanation = outsideExplanation
          .split(rendered.replace(/\s+/g, ' '))
          .join('');
    }
  }
  const otherToolText = wiring.tools
    .filter((t) => t.name !== 'concept_journal')
    .map((t) =>
      JSON.stringify({
        description: t.description,
        label: t.label,
        parameters: t.parameters,
      }),
    )
    .join('\n');
  return {
    'only-requested-tools':
      JSON.stringify([...wiring.active].sort()) ===
        JSON.stringify([...expectedTools].sort()) &&
      JSON.stringify(wiring.tools.map((t) => t.name).sort()) ===
        JSON.stringify([...expectedTools].sort()),
    'cratylus-only-in-tool-explanation': !/cratylus/i.test(
      outsideExplanation + otherToolText,
    ),
    'no-memory-block':
      !/<(?:memories|memory(?:[_-]context)?|mental_models|hindsight_memories|relevant_memories)\b|(?:^|\n)\s*#{1,6}\s+(?:memory|memories)\b/i.test(
        prompt,
      ),
    'memory-disabled':
      wiring.memory?.backend === 'off' && wiring.memory.active === false,
  };
}
