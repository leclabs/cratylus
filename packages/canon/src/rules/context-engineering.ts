import type { Ruleset } from '@cratylus/schema';

/** Ten principles of context engineering, each adopted by its name. */
export const contextEngineering: Ruleset = {
  name: 'context-engineering',
  description:
    'Ten principles of context engineering, each adopted by its name, as a cross-cutting baseline for the context a project authors.',
  rules: [
    {
      name: 'context-engineering-cratylic-context-design',
      description: 'Context is authored by Cratylic context design.',
      statement:
        "Cratylic context design: each concept is invoked by its Cratylic name, the established term whose meaning in the concept's domain lies closest to the concept, with a precising definition only where the name lacks or adds to the concept; a term is coined only where no established one exists.",
      why: 'A term already carries most of its concept, so the context carries only what the term leaves out.',
    },
    {
      name: 'context-engineering-maxim-of-quantity',
      description: 'Context follows the maxim of quantity.',
      statement:
        'Maxim of quantity: judged against what the model and the context its reader holds already carry.',
      why: "Every token spends the reader's attention; one that tells it nothing new dilutes those that do.",
    },
    {
      name: 'context-engineering-single-source-of-truth',
      description: 'Context keeps a single source of truth.',
      statement:
        "Single source of truth: each fact has one home in the project's persistent context, every other persistent mention referencing it.",
      why: 'One home lets a fact read the same everywhere and change in one place.',
    },
    {
      name: 'context-engineering-living-documentation',
      description: 'Persistent context is living documentation.',
      statement:
        'Living documentation: persistent context states what holds now, its rationale included; version control keeps what changed.',
      why: 'A reader takes what it reads as what holds, so superseded text read beside current text clashes with it.',
    },
    {
      name: 'context-engineering-technical-register',
      description: 'Context is written in the technical register.',
      statement:
        'Technical register: between peers, each established term named and never explained, the wording carrying its own weight with no markup for emphasis.',
      why: 'A model already holds the established terms; the term that names one carries its meaning whole.',
    },
    {
      name: 'context-engineering-affirmative-instruction',
      description: 'Context gives affirmative instructions.',
      statement:
        'Affirmative instruction: states what holds and why it holds, a prohibition stated as the state it protects.',
      why: 'A reader acts on the state its context names, and naming an unwanted state primes it.',
    },
    {
      name: 'context-engineering-right-altitude',
      description: 'Context is written at the right altitude.',
      statement:
        'Right altitude: goals, constraints and decision principles, exact where a value or an order is itself a constraint.',
      why: 'Principles carry to cases the author did not foresee; a script holds only for the cases it lists.',
    },
    {
      name: 'context-engineering-context-sharing',
      description: 'Handoffs share context.',
      statement:
        'Context sharing: a handoff is self-contained, carrying its purpose, its end state, the decisions already taken and the state of the work.',
      why: 'A receiver that holds the reasons continues the work; one without them decides again what was settled, and parallel receivers decide it differently.',
    },
    {
      name: 'context-engineering-progressive-disclosure',
      description: 'Context is disclosed progressively.',
      statement:
        'Progressive disclosure: always-loaded context holds what every task needs and where the rest lives; the rest is loaded when a task needs it.',
      why: "A model's attention thins as its context grows, so context loaded for its task keeps the window to what the task uses.",
    },
    {
      name: 'context-engineering-provenance',
      description: 'Persistent context keeps its provenance.',
      statement:
        'Provenance: each claim in persistent context traceable to its source, an inference marked as one.',
      why: 'A traced claim can be checked again; an untraced one, read again, becomes accepted fact.',
    },
  ],
};
