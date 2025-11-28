# Test Patterns: Callbacks vs Promises vs Async/Await

## Current State

The test suite currently uses **callback-based tests** with Jasmine's `done()` callback.

## Comparison of Approaches

### 1. Callback Pattern (Current)

```javascript
describe('Document Creation', () => {
  beforeEach(done => {
    helper.beforeEach()
      .then(generatedToken => {
        token = generatedToken;
        done();
      })
      .catch(err => {
        console.log('Error:', err);
        done();
      });
  });

  it('should create a document successfully', done => {
    request(app)
      .post('/api/documents')
      .send({ title: 'Doc 1', content: 'Content' })
      .set('x-access-token', token)
      .end((err, res) => {
        expect(err).toBeNull();
        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Doc 1');
        done();
      });
  });
});
```

**Pros:**
- ✅ Works with older Jasmine versions
- ✅ Explicit control over when test completes
- ✅ Clear error handling with try/catch in callbacks

**Cons:**
- ❌ Verbose - requires `done()` callback
- ❌ Easy to forget `done()` → test hangs
- ❌ Nested callbacks can get messy
- ❌ Error handling requires explicit `.catch()` or try/catch
- ❌ Can't use `await` for sequential operations

### 2. Promise Pattern

```javascript
describe('Document Creation', () => {
  beforeEach(() => {
    return helper.beforeEach()
      .then(generatedToken => {
        token = generatedToken;
      });
  });

  it('should create a document successfully', () => {
    return request(app)
      .post('/api/documents')
      .send({ title: 'Doc 1', content: 'Content' })
      .set('x-access-token', token)
      .then(res => {
        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Doc 1');
      });
  });
});
```

**Pros:**
- ✅ No `done()` callback needed
- ✅ Cleaner than callbacks
- ✅ Automatic error handling (failed promises = failed tests)
- ✅ Can chain multiple async operations

**Cons:**
- ❌ Must remember to `return` the promise
- ❌ Still somewhat verbose with `.then()` chains
- ❌ Can't use `await` for cleaner syntax

### 3. Async/Await Pattern (Recommended)

```javascript
describe('Document Creation', () => {
  beforeEach(async () => {
    token = await helper.beforeEach();
  });

  it('should create a document successfully', async () => {
    const res = await request(app)
      .post('/api/documents')
      .send({ title: 'Doc 1', content: 'Content' })
      .set('x-access-token', token);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Doc 1');
  });
});
```

**Pros:**
- ✅ Most readable and concise
- ✅ No `done()` callback needed
- ✅ No need to remember `return`
- ✅ Automatic error handling
- ✅ Easy to write sequential operations
- ✅ Looks like synchronous code
- ✅ Better stack traces on errors
- ✅ Modern JavaScript standard

**Cons:**
- ❌ Requires Jasmine 3.5+ (we have 2.4.1)
- ❌ Requires Node.js 8+ (we have 22.x ✅)

## Performance Comparison

| Pattern | Setup Time | Execution Time | Memory | Readability |
|---------|-----------|----------------|--------|-------------|
| Callbacks | Same | Same | Slightly more (closures) | ⭐⭐ |
| Promises | Same | Same | Same | ⭐⭐⭐ |
| Async/Await | Same | Same | Same | ⭐⭐⭐⭐⭐ |

**Performance is essentially identical** - the difference is in code readability and maintainability.

## Real-World Example Comparison

### Scenario: Test that requires multiple async operations

#### Callback Pattern (Current)
```javascript
it('should update document and verify', done => {
  request(app)
    .post('/api/documents')
    .send({ title: 'Doc 1' })
    .set('x-access-token', token)
    .end((err, res) => {
      const docId = res.body._id;
      
      request(app)
        .put(`/api/documents/${docId}`)
        .send({ title: 'Updated Doc' })
        .set('x-access-token', token)
        .end((err, res) => {
          expect(res.body.title).toBe('Updated Doc');
          
          request(app)
            .get(`/api/documents/${docId}`)
            .set('x-access-token', token)
            .end((err, res) => {
              expect(res.body.title).toBe('Updated Doc');
              done();  // Easy to forget!
            });
        });
    });
});
```
**Lines:** 22 | **Nesting:** 3 levels | **Readability:** ⭐⭐

#### Promise Pattern
```javascript
it('should update document and verify', () => {
  let docId;
  
  return request(app)
    .post('/api/documents')
    .send({ title: 'Doc 1' })
    .set('x-access-token', token)
    .then(res => {
      docId = res.body._id;
      return request(app)
        .put(`/api/documents/${docId}`)
        .send({ title: 'Updated Doc' })
        .set('x-access-token', token);
    })
    .then(res => {
      expect(res.body.title).toBe('Updated Doc');
      return request(app)
        .get(`/api/documents/${docId}`)
        .set('x-access-token', token);
    })
    .then(res => {
      expect(res.body.title).toBe('Updated Doc');
    });
});
```
**Lines:** 20 | **Nesting:** 1 level | **Readability:** ⭐⭐⭐

#### Async/Await Pattern (Best)
```javascript
it('should update document and verify', async () => {
  const createRes = await request(app)
    .post('/api/documents')
    .send({ title: 'Doc 1' })
    .set('x-access-token', token);
  
  const docId = createRes.body._id;
  
  const updateRes = await request(app)
    .put(`/api/documents/${docId}`)
    .send({ title: 'Updated Doc' })
    .set('x-access-token', token);
  
  expect(updateRes.body.title).toBe('Updated Doc');
  
  const getRes = await request(app)
    .get(`/api/documents/${docId}`)
    .set('x-access-token', token);
  
  expect(getRes.body.title).toBe('Updated Doc');
});
```
**Lines:** 18 | **Nesting:** 0 levels | **Readability:** ⭐⭐⭐⭐⭐

## Recommendation

### Migrate to Async/Await

**Why:**
1. **Readability** - Code reads like synchronous code
2. **Maintainability** - Easier to modify and debug
3. **Error Handling** - Automatic, no need for explicit `.catch()` or `done()`
4. **Modern Standard** - Industry best practice
5. **No Performance Cost** - Same performance as callbacks/promises

**Migration Path:**

1. **Update Jasmine** (required for async/await support)
   ```json
   "jasmine": "^5.5.0"  // Current: 2.4.1
   ```

2. **Convert tests incrementally**
   - Start with new tests using async/await
   - Gradually convert existing tests
   - Both patterns can coexist during migration

3. **Example conversion:**
   ```javascript
   // Before
   it('test', done => {
     helper.beforeEach()
       .then(token => {
         // test code
         done();
       });
   });
   
   // After
   it('test', async () => {
     const token = await helper.beforeEach();
     // test code
   });
   ```

## Migration Example

### Before (Callbacks)
```javascript
describe('User Spec', () => {
  beforeEach(done => {
    helper.beforeEach()
      .then(generatedToken => {
        token = generatedToken;
        done();
      })
      .catch(err => {
        console.log('Error:', err);
        done();
      });
  });

  it('should create a user', done => {
    request(app)
      .post('/api/users')
      .send({ username: 'test' })
      .end((err, res) => {
        expect(err).toBeNull();
        expect(res.statusCode).toBe(201);
        done();
      });
  });
});
```

### After (Async/Await)
```javascript
describe('User Spec', () => {
  beforeEach(async () => {
    token = await helper.beforeEach();
  });

  it('should create a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'test' });
    
    expect(res.statusCode).toBe(201);
  });
});
```

**Reduction:** 
- 7 fewer lines
- No `done()` callbacks
- No error handling boilerplate
- Clearer intent

## Conclusion

**Current:** Callbacks (verbose, error-prone)  
**Recommended:** Async/Await (clean, modern, maintainable)

**Action Items:**
1. Update Jasmine to 5.x
2. Convert tests to async/await incrementally
3. Update test documentation

**Estimated Effort:** 2-4 hours for full migration  
**Benefit:** Significantly improved code readability and maintainability
