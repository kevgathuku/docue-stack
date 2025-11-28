# Elm Components - Quick Start

## Running the App

```bash
# Development (with Elm debugger)
pnpm --filter frontend start

# Production build (optimized)
pnpm --filter frontend build

# Test Elm code
pnpm --filter frontend test:elm
```

## Debugging in Browser

### 1. Open DevTools Console
Press `F12` or `Cmd+Option+I`

### 2. Access Elm Apps
```javascript
// View all Elm app instances
window.__ELM_APPS__

// Get the first app
const app = window.__ELM_APPS__[0]

// Send data through ports (if available)
app.ports.somePort.send({ data: "value" })
```

### 3. Use Elm Debugger
- Look for small icon in bottom-right of Elm components
- Click to open time-travel debugger
- View message history and state

## Common Debugging Scenarios

### Component Not Rendering?
1. Check console for `[ReactElm]` errors
2. Verify Elm file compiles: `pnpm --filter frontend test:elm`
3. Check import: `import * as ElmModule from '../Module.elm'`

### Port Not Working?
1. Add logging:
   ```javascript
   ports.myPort.subscribe(function(data) {
     console.log('[Port] Received:', data);
   });
   ```
2. Check port name matches Elm definition
3. Verify app initialized: `window.__ELM_APPS__`

### Flags Issue?
1. Check console: `[ReactElm] Initializing Elm module with flags: {...}`
2. Verify types match Elm definition
3. Log flags before passing:
   ```javascript
   console.log('Flags:', this.flags);
   ```

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Elm Debugger | ✅ Enabled | ❌ Disabled |
| Console Logs | ✅ Verbose | ❌ Minimal |
| Optimization | ❌ None | ✅ Full |
| Source Maps | ✅ Yes | ✅ Yes |
| HMR | ⚠️ Page reload | N/A |

## File Structure

```
src/components/
├── Login.elm              # Elm source
├── Login/
│   ├── Login.jsx          # React wrapper
│   └── __tests__/
│       └── Login-elm-integration.test.js
```

## Creating New Elm Component

1. **Create Elm file**: `src/components/MyComponent.elm`
2. **Create React wrapper**: `src/components/MyComponent/MyComponent.jsx`
   ```javascript
   import * as ElmMyComponent from '../MyComponent.elm';
   
   export default class MyComponent extends React.Component {
     render() {
       return <Elm src={ElmMyComponent} />;
     }
   }
   ```
3. **Test**: `pnpm --filter frontend test:elm`

## Resources

- Full debugging guide: `ELM_DEBUGGING.md`
- Vite migration notes: `VITE_MIGRATION.md`
- Testing guide: `PHASE3_TESTING.md`
