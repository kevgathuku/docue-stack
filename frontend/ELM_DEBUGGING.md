# Elm Debugging Guide

This guide covers debugging Elm components in the React + Elm hybrid application.

## Development Mode Features

### 1. Elm Debug Mode

In development, Elm components run with the **Elm Debugger** enabled, which provides:
- Time-travel debugging
- Message history
- State inspection

The debugger appears as a small icon in the bottom-right corner of Elm components.

**Configuration**: Set in `vite.config.js`
```javascript
elm({
  debug: process.env.NODE_ENV !== 'production',
  optimize: process.env.NODE_ENV === 'production',
})
```

### 2. Browser Console Logging

The `ReactElm` wrapper logs helpful information:

```javascript
// Elm initialization
[ReactElm] Initializing Elm module with flags: {...}

// Success
[ReactElm] Elm app initialized. Access via window.__ELM_APPS__

// Errors
[ReactElm] Elm module is undefined
[ReactElm] Error initializing Elm app: ...
```

### 3. Access Elm Apps from Console

All Elm app instances are stored in `window.__ELM_APPS__`:

```javascript
// In browser console
window.__ELM_APPS__
// => [ElmApp, ElmApp, ...]

// Access the first Elm app
const app = window.__ELM_APPS__[0]

// Send messages through ports (if available)
app.ports.somePort.send(data)
```

## Debugging Techniques

### Inspect Elm Component State

1. Open browser DevTools (F12)
2. Look for the Elm debugger icon (bottom-right of Elm components)
3. Click to open the time-travel debugger
4. View message history and state changes

### Debug Port Communication

Add logging to port subscriptions:

```javascript
setupPorts(ports) {
  ports.handleSubmit.subscribe(function(data) {
    console.log('[Port] handleSubmit received:', data);
    // Your logic here
  });
}
```

### Debug Flags

Check what flags are passed to Elm:

```javascript
// In component
flags = {
  token: localStorage.getItem('user'),
  baseURL: BaseActions.BASE_URL
};

// Logs automatically in development
// [ReactElm] Initializing Elm module with flags: { token: "...", baseURL: "..." }
```

### Common Issues

#### 1. Elm Module Not Loading

**Symptom**: `[ReactElm] Elm module is undefined`

**Solutions**:
- Check import: `import * as ElmModule from '../Module.elm'`
- Verify Elm file compiles: `pnpm --filter frontend test:elm`
- Check browser console for Elm compilation errors

#### 2. Port Not Working

**Symptom**: Port subscription not firing

**Solutions**:
- Verify port is defined in Elm: `port handleSubmit : Value -> Cmd msg`
- Check port name matches exactly
- Add console.log in subscription handler
- Verify Elm app is initialized: `window.__ELM_APPS__`

#### 3. Flags Type Mismatch

**Symptom**: Elm app doesn't initialize or crashes

**Solutions**:
- Check Elm type definition matches JS flags
- Use `Json.Decode.Value` for flexible flags
- Log flags before passing: `console.log(this.flags)`

## Elm Compiler Errors

### View Compilation Errors

Vite shows Elm compilation errors in:
1. Terminal where dev server is running
2. Browser overlay (red error screen)
3. Browser console

### Common Elm Errors

**Type Mismatch**:
```
-- TYPE MISMATCH ------------------------------------------------

The 1st argument to `view` is not what I expect:
```
**Solution**: Check function signatures and types

**Missing Import**:
```
-- NAMING ERROR --------------------------------------------------

I cannot find a `Html` variable:
```
**Solution**: Add `import Html exposing (..)`

## Testing Elm Components

### Run Elm Tests

```bash
pnpm --filter frontend test:elm
```

### Test React-Elm Integration

```bash
pnpm --filter frontend test:ci
```

The integration tests verify:
- Elm modules load correctly
- ReactElm wrapper works
- Props and flags are passed properly

## Performance Debugging

### Check Elm Bundle Size

```bash
pnpm --filter frontend build
```

Look for Elm-compiled files in build output:
```
build/assets/index-[hash].js  635KB (200KB gzipped)
```

### Optimize Elm Code

For production, Elm is automatically optimized:
- Dead code elimination
- Minification
- Uglification

Controlled by `optimize: true` in production builds.

## Hot Module Replacement (HMR)

### Elm HMR Behavior

- **React components**: Hot reload instantly
- **Elm components**: Full page reload required
- **Elm code changes**: Trigger recompilation + reload

This is normal - Elm's architecture doesn't support HMR like React does.

## Debugging Tools

### Browser Extensions

1. **Elm DevTools** (if available for your browser)
   - Enhanced Elm debugger
   - Better state visualization

2. **React DevTools**
   - Inspect React wrapper components
   - View props passed to Elm components

### VS Code Extensions

1. **Elm** by Elm tooling
   - Syntax highlighting
   - Error checking
   - Auto-formatting

2. **Elm Language Server**
   - IntelliSense
   - Go to definition
   - Refactoring support

## Production Debugging

In production, Elm debug mode is disabled for performance. To debug production issues:

1. **Reproduce locally**: Set `NODE_ENV=production` and build
2. **Add logging**: Use `Debug.log` in Elm (removed in production builds)
3. **Check browser console**: Look for JavaScript errors
4. **Verify flags**: Ensure production flags are correct

## Getting Help

### Elm Compilation Issues
- Check Elm compiler output in terminal
- Read error messages carefully (Elm has excellent error messages)
- Verify Elm syntax and types

### Integration Issues
- Check `ReactElm.js` console logs
- Verify port names and types
- Inspect `window.__ELM_APPS__` in console

### Performance Issues
- Use Elm debugger to track message frequency
- Check for unnecessary re-renders in React
- Profile with browser DevTools

## Quick Reference

```javascript
// Access Elm apps
window.__ELM_APPS__

// Check if Elm is in debug mode
// Look for debugger icon in bottom-right of Elm components

// View Elm compilation
// Terminal output when running: pnpm --filter frontend start

// Test Elm code
pnpm --filter frontend test:elm

// Test integration
pnpm --filter frontend test:ci
```
