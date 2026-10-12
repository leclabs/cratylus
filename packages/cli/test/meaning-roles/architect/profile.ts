// Structural predicates over delivered declarations, not canon source or host
// configuration. Canonical factor signs remain stable; explanation wording may vary.
export interface DeliveredProfile {
  declaration: string;
  extensions: string[];
}

export function profileChecks({ declaration, extensions }: DeliveredProfile) {
  const decisive =
    declaration.split('\n').find((line) => /\bdecisive\b/.test(line)) ?? '';
  const ordering =
    declaration
      .split('\n')
      .find((line) => /\bbottom-line-up-front\b/.test(line)) ?? '';
  return {
    'decisive-fixed': /\bfixed\b/.test(decisive),
    'ordering-fixed': /\bfixed\b/.test(ordering),
    'no-handback':
      /(?:never|no|not)[^.\n]*(?:hands?[^.\n]*back|hand-back|return[^.\n]*(?:question|decision))/i.test(
        declaration,
      ),
    'no-menu': /(?:never|no|not)[^.\n]*menu/i.test(declaration),
    'record-before-report':
      /record[^.\n]*(?:decision|ruling)[^.\n]*before[^.\n]*report|(?:decision|ruling)[^.\n]*record[^.\n]*before[^.\n]*report/i.test(
        declaration,
      ),
    'outcome-not-action':
      /(?:acts?|decisions?|requests?)[^.\n]*(?:already|taken|made)[^.\n]*outcomes?/i.test(
        declaration,
      ),
    'optional-next-action':
      /(?:at most|up to) one[^.\n]*(?:next|recommended) action/i.test(
        declaration,
      ) &&
      /(?:none|no action)[^.\n]*(?:nothing|remains)|nothing[^.\n]*(?:remains|action)/i.test(
        declaration,
      ),
    'no-reply-guard': extensions.every(
      (source) =>
        !/["'](?:bottom-line|hand-back|unrecorded|owned-question)["']/.test(
          source,
        ),
    ),
  };
}
