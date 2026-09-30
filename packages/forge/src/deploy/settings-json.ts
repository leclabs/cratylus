// A host's `settings.json`, written back in the style it was found in.
//
// The file is the HOST'S: install and uninstall each change a key or two of it, and
// every byte they do not mean to change must come back as it was. Serialising with a
// fixed style would turn a one-line file into a pretty-printed one on the first write
// and leave it so after the uninstall that removed the only keys install added. So the
// style of the bytes being replaced is read and repeated: no indentation for a file on
// one line, else the whitespace its first indented line opens with, and its trailing
// newline as it stood. A file not yet there takes two spaces and a newline.

/** `settings` as JSON in the style of `like`, the file's text before this write. */
export function settingsJson(settings: unknown, like?: string): string {
  if (like === undefined || like.trim() === '') {
    return `${JSON.stringify(settings, null, 2)}\n`;
  }
  const body = like.trim();
  const indent = body.includes('\n')
    ? (/^([ \t]+)\S/m.exec(body)?.[1] ?? 2)
    : undefined;
  return `${JSON.stringify(settings, null, indent)}${like.endsWith('\n') ? '\n' : ''}`;
}
