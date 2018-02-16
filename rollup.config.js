// Rollup plugins
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import closure from 'rollup-plugin-closure-compiler';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/index.cjs.js',
      format: 'cjs',
      name: 'RestLoader',
      sourcemap: 'external',
    },
    {
      file: 'lib/index.es.js',
      format: 'es',
      sourcemap: 'external',
    },
  ],
  external: Object.keys(pkg.dependencies),
  plugins: [
    typescript({}),
    resolve({
      extensions: ['.js', '.json', '.ts', '.tsx'],
      module: true,
      jsnext: true,
    }),
    commonjs(),
    closure({
      module_resolution: 'NODE',
      processCommonJsModules: true,
    }),
  ],
};
