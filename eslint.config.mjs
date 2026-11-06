import {createRequire} from 'node:module';

const require = createRequire(new URL('./dev/package.json', import.meta.url));
const js = require('@eslint/js');

export default [
  js.configs.recommended,
  {
    files: ['media-library.js', 'media-metadata.js'],
    languageOptions: {
      globals: {
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        document: 'readonly',
        matchMedia: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
];
