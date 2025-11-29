# Babel ES6 Module Configuration for Jest

## Problem

Jest runs in Node.js CommonJS mode by default, but ReScript compiles to ES6 modules using `import`/`export` syntax. This causes Jest to fail when trying to parse ReScript compiled files and the `@rescript/runtime` package.

## Solution

Updated `babel.config.cjs` to explicitly transform ES6 modules to CommonJS for Jest:

```javascript
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        // Transform ES6 modules to CommonJS for Jest
        modules: 'commonjs',
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            // Ensure ES6 modules are transformed to CommonJS in test environment
            modules: 'commonjs',
          },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    },
  },
};
```

## Key Changes

1. **Added `modules: 'commonjs'`** to `@babel/preset-env` configuration
   - Tells Babel to transform ES6 `import`/`export` to CommonJS `require`/`module.exports`
   - Required for Jest to parse ReScript compiled files

2. **Added `env.test` configuration**
   - Ensures the transformation happens specifically in test environment
   - Provides explicit control over test-time behavior

## How It Works

1. **Development/Production**: Vite handles ES6 modules natively (no transformation needed)
2. **Testing**: Babel transforms ES6 modules to CommonJS for Jest compatibility

## Jest Configuration

The `jest.config.js` is already configured to:
- Transform `.res.js` files (ReScript compiled output) with Babel
- Transform `@rescript` packages from node_modules
- Use the Babel config file

```javascript
transform: {
  '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  '^.+\\.res\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
},
transformIgnorePatterns: [
  'node_modules/(?!(@rescript)/)',
],
```

## Testing Results

✅ All 26 test suites passing
✅ All 236 tests passing
✅ ReScript bindings compile and work correctly
✅ No ES6 module parsing errors

## Alternative Approaches Considered

1. **Jest Experimental ESM Support**: Requires `"type": "module"` in package.json, which would affect the entire project
2. **Mock ReScript Bindings**: Would skip testing actual binding functionality
3. **Dynamic Imports**: Still fails due to ReScript runtime dependencies

The Babel transformation approach is the most reliable and maintainable solution.

## References

- [Babel preset-env modules option](https://babeljs.io/docs/en/babel-preset-env#modules)
- [Jest with ES6 modules](https://jestjs.io/docs/ecmascript-modules)
- [ReScript compilation output](https://rescript-lang.org/docs/manual/latest/build-configuration)
