// The command's name, RE-EXPORTED from the one module that declares it.
//
// This file used to DERIVE the name by reading `@cratylus/forge`'s own `bin` key,
// back when forge shipped the command. It is a library now — it declares no bin, so
// there is nothing here to derive from and nothing to check against.
//
// The name lives in `@cratylus/runtime`, which is the contract leaf: it depends on
// nothing, so every package that needs the name imports it without inverting an
// edge. `forge → runtime` is already a permitted edge and already carried for the
// projection facts.
//
// The re-export is kept rather than deleted so the ~12 modules that read it are not
// each rewritten to name another package — one import site, one home, and a reader
// who follows it lands on the declaration.
export { CLI_BIN } from '@cratylus/runtime/bin-name';
