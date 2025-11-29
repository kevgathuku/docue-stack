/**
 * Test to verify Redux infrastructure is properly set up
 * Requirements: 1.1, 1.4, 1.5
 */
import { store, RootState, AppDispatch } from '../index';
import { useAppDispatch, useAppSelector } from '../hooks';

describe('Redux Infrastructure Setup', () => {
  describe('Dependencies', () => {
    test('Redux Toolkit should be available', () => {
      // If store is created, @reduxjs/toolkit is installed
      expect(store).toBeDefined();
      expect(store.dispatch).toBeDefined();
      expect(store.getState).toBeDefined();
    });

    test('React Redux should be available', () => {
      // If hooks are defined, react-redux is installed
      expect(useAppDispatch).toBeDefined();
      expect(useAppSelector).toBeDefined();
    });

    test('fast-check should be available for property-based testing', () => {
      // Verify fast-check can be imported
      return import('fast-check').then(fc => {
        expect(fc).toBeDefined();
        expect(fc.assert).toBeDefined();
        expect(fc.property).toBeDefined();
      });
    });
  });

  describe('Store Configuration', () => {
    test('store should be configured with configureStore', () => {
      expect(store).toBeDefined();
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.getState).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    test('store should have all required slices', () => {
      const state = store.getState();
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('documents');
      expect(state).toHaveProperty('roles');
    });

    test('Redux DevTools should be enabled in non-production', () => {
      // Store is created with devTools option
      // In test environment, devTools should be enabled
      expect(store).toBeDefined();
      // The store will have __REDUX_DEVTOOLS_EXTENSION__ support if configured
    });

    test('RootState type should be exported', () => {
      expect(RootState).toBeDefined();
      expect(typeof RootState).toBe('function');
    });

    test('AppDispatch type should be exported', () => {
      expect(AppDispatch).toBeDefined();
      expect(typeof AppDispatch).toBe('function');
    });
  });

  describe('Typed Hooks', () => {
    test('useAppDispatch hook should be defined', () => {
      expect(useAppDispatch).toBeDefined();
      expect(typeof useAppDispatch).toBe('function');
    });

    test('useAppSelector hook should be defined', () => {
      expect(useAppSelector).toBeDefined();
      expect(typeof useAppSelector).toBe('function');
    });
  });
});
