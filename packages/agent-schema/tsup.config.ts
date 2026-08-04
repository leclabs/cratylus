import { defineConfig } from 'tsup';

// One library pass, no CLI pass — this package ships no bin. An `exports` map and
// this entry list are two enumerations of one fact: add here and there together,
// or the subpath resolves to nothing.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hook/index': 'src/hook/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
});
