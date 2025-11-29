/**
 * Tests for ReScript bindings
 * These tests verify that the bindings compile correctly
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

describe('ReScript Bindings', () => {
  describe('Binding compilation', () => {
    it('should compile LocalStorage binding', () => {
      const bindingPath = resolve(__dirname, '../LocalStorage.res.js');
      expect(existsSync(bindingPath)).toBe(true);
    });

    it('should compile Redux binding', () => {
      const bindingPath = resolve(__dirname, '../Redux.res.js');
      expect(existsSync(bindingPath)).toBe(true);
    });

    it('should compile ReactRouter binding', () => {
      const bindingPath = resolve(__dirname, '../ReactRouter.res.js');
      expect(existsSync(bindingPath)).toBe(true);
    });
  });

  describe('LocalStorage operations (direct)', () => {
    it('should handle localStorage operations directly', () => {
      // Test localStorage directly without the binding
      // This verifies the environment is set up correctly
      localStorage.setItem('test-key', 'test-value');
      const result = localStorage.getItem('test-key');
      expect(result).toBe('test-value');
      localStorage.removeItem('test-key');
    });

    it('should return null for non-existent keys', () => {
      const result = localStorage.getItem('non-existent-key');
      expect(result).toBeNull();
    });
  });
});
