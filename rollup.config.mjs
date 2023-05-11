/* eslint-disable import/no-extraneous-dependencies */
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

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
  plugins: [resolve(), commonjs(), typescript(), terser()],
  external: ['react', 'react-dom'],
};
