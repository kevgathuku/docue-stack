const babelParser = require('@babel/eslint-parser');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2022,
        sourceType: 'module',
        babelOptions: {
          babelrc: false,
          configFile: false,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        jasmine: 'readonly',
      },
    },
    rules: {
      // Code style rules
      indent: ['warn', 2],
      quotes: ['error', 'single'],
      'linebreak-style': ['error', 'unix'],
      semi: ['error', 'always'],

      // Disabled rules from original config
      'no-console': 'off',
      'no-case-declarations': 'off',
      'no-class-assign': 'off',
      'no-const-assign': 'off',
      'no-dupe-class-members': 'off',
      'no-empty-pattern': 'off',
      'no-new-symbol': 'off',
      'no-self-assign': 'off',
      'no-this-before-super': 'off',
      'no-unexpected-multiline': 'off',
      'no-unused-labels': 'off',
      'constructor-super': 'off',
    },
  },
];
