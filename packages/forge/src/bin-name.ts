// The command's name, RE-EXPORTED from the one module that declares it.
//
// The name lives in `@cratylus/runtime`, which is the contract leaf: it depends on
// nothing, so every package that needs the name imports it without inverting an
// edge. `forge → runtime` is already a permitted edge and already carried for the
// projection facts.
//
// The re-export keeps the modules that read it importing one site in their own
// package; a reader who follows it lands on the declaration.
export { CLI_BIN } from '@cratylus/runtime/bin-name';
