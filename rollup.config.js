import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: `dist/index.js`,
      format: 'umd',
      name: 'ReactSimplyCarousel',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
      exports: 'auto',
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
      exports: 'auto',
    },
  ],
  plugins: [
    nodeResolve(),
    babel({ babelHelpers: 'bundled', extensions: ['tsx'] }),
    terser(),
  ],
  external: ['react', 'react-dom'],
};
