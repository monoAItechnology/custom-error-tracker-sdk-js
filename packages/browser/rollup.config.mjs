import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../error-tracker.config.js');

export default [
  // ESM build
  {
    input: {
      index: 'src/index.ts',
      auto: 'src/auto.ts',
    },
    output: {
      dir: 'dist/esm',
      format: 'esm',
      preserveModules: true,
      sourcemap: true,
    },
    external: ['@monoai/error-tracker-core'],
    plugins: [
      alias({
        entries: [
          { find: '@monoai/error-tracker-config', replacement: configPath },
        ],
      }),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        outDir: 'dist/esm',
      }),
    ],
  },
  // CommonJS build
  {
    input: {
      index: 'src/index.ts',
      auto: 'src/auto.ts',
    },
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      preserveModules: true,
      sourcemap: true,
      exports: 'named',
    },
    external: ['@monoai/error-tracker-core'],
    plugins: [
      alias({
        entries: [
          { find: '@monoai/error-tracker-config', replacement: configPath },
        ],
      }),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        outDir: 'dist/cjs',
      }),
    ],
  },
  // UMD bundle for CDN (standalone, includes core)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/browser/error-tracker.js',
        format: 'umd',
        name: 'ErrorTracker',
        sourcemap: true,
      },
      {
        file: 'dist/browser/error-tracker.min.js',
        format: 'umd',
        name: 'ErrorTracker',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
  },
];
