# Jest ESM Support for ReScript Bindings

## Summary

✅ **YES! Jest 29+ CAN handle ES6 modules from ReScript with proper configuration.**

## Configuration

### 1. Package.json
```json
{
  "type": "module"
}
```

### 2. Jest Config (jest.config.js)
```javascript
export default {
  // Enable experimental ESM support
  extensionsToTreatAsEsm: ['.jsx', '.res.js'],
  
  // Transform ReScript files
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
    '^.+\\.res\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  
  // Transform @rescript packages
  transformIgnorePatterns: [
    'node_modules/(?!@rescript)',
  ],
};
```

### 3. Babel Config (babel.config.cjs)
```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: false, // Keep ES6 modules for Jest ESM
    }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
```

### 4. Setup Files (setupTests.js)
```javascript
// Use ES6 imports instead of require()
import '@testing-library/jest-dom';
import sessionstorage from 'sessionstorage';
import localStorage from 'localStorage';
```

### 5. Test Files
```javascript
// Import jest explicitly
import { jest } from '@jest/globals';

// Use import.meta.url for __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import ReScript bindings directly!
import * as LocalStorageBinding from '../LocalStorage.res.js';
import * as MaterializeBinding from '../Materialize.res.js';
import * as FetchBinding from '../Fetch.res.js';
```

## Running Tests with ESM

```bash
NODE_OPTIONS="--experimental-vm-modules" pnpm test
```

Or add to package.json scripts:
```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--experimental-vm-modules' jest"
  }
}
```

## Test Results

✅ **23 out of 31 tests passing** with direct ReScript binding imports
✅ **ReScript ES6 modules successfully imported in Jest**
✅ **@rescript/runtime ES6 modules handled correctly**

## Important Notes

### External Bindings
ReScript external bindings (like `@val external setItem`) are type declarations only and don't get compiled to JavaScript. They're meant to be called from ReScript code, not JavaScript tests.

**Example:**
```rescript
// This is just a type declaration - no JS output
@scope("localStorage") @val
external setItem: (string, string) => unit = "setItem"

// This has implementation - gets compiled to JS
let getItemOption = (key: string): option<string> => {
  getItem(key)->Nullable.toOption
}
```

**Compiled Output:**
```javascript
// Only getItemOption is exported
export {
  getItemOption,
}
```

### What Can Be Tested

✅ **ReScript functions with implementations** (like `getItemOption`, `showSuccess`, `createAuthHeaders`)
✅ **Helper functions** (like `methodToString`)
❌ **External bindings** (these are type-only, test the underlying APIs instead)

### Testing Strategy

1. **Test ReScript helper functions directly** - These have implementations and export to JS
2. **Test underlying APIs for external bindings** - Verify localStorage, fetch, etc. work
3. **Integration tests in components** - Validate bindings work in actual usage

## Benefits of ESM Support

1. **Direct binding imports** - Can import and test ReScript compiled code
2. **Better error messages** - ES6 import errors are clearer
3. **Future-proof** - ESM is the JavaScript standard
4. **Consistent with Vite** - Same module system in dev and test

## Limitations

- Requires `NODE_OPTIONS="--experimental-vm-modules"` flag
- ESM support is still experimental in Jest
- Some Jest features may not work perfectly with ESM
- External bindings don't export to JavaScript (by design)

## Recommendation

**For this project:** The ESM approach works well and allows direct testing of ReScript helper functions. The 8 failing tests are for external bindings which are type-only declarations - these should be tested through the underlying APIs or component integration tests.

**Alternative:** If ESM causes issues, the CommonJS approach (with `modules: 'commonjs'` in Babel) also works well and is more stable, though it requires testing underlying APIs instead of importing bindings directly.
