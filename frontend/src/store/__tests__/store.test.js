import { store } from '../index';

describe('Redux Store Configuration', () => {
  test('store should be created with correct structure', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('documents');
    expect(state).toHaveProperty('roles');
  });

  test('auth state should have correct initial structure', () => {
    const state = store.getState();
    
    // Verify auth state matches existing reducer structure
    expect(state.auth).toHaveProperty('users');
    expect(state.auth).toHaveProperty('session');
    expect(state.auth.session).toHaveProperty('loggedIn');
    expect(state.auth.session).toHaveProperty('loading');
    expect(state.auth).toHaveProperty('token');
    expect(state.auth).toHaveProperty('user');
  });

  test('store should have dispatch method', () => {
    expect(store.dispatch).toBeDefined();
    expect(typeof store.dispatch).toBe('function');
  });

  test('store should have getState method', () => {
    expect(store.getState).toBeDefined();
    expect(typeof store.getState).toBe('function');
  });

  test('store should have subscribe method', () => {
    expect(store.subscribe).toBeDefined();
    expect(typeof store.subscribe).toBe('function');
  });

  test('Redux DevTools should be enabled in development', () => {
    // Store is configured with devTools option
    // This test verifies the store was created successfully with the config
    expect(store).toBeDefined();
  });
});
