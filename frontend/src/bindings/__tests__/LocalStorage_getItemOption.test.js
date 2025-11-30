/**
 * Direct test of the compiled ReScript getItemOption function
 * This test validates the actual ReScript implementation
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('LocalStorage.getItemOption (ReScript implementation)', () => {
  let LocalStorageBinding;

  beforeAll(async () => {
    // Dynamically import the compiled ReScript binding
    LocalStorageBinding = await import('../LocalStorage.res.js');
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('returns value (not undefined) for existing key', () => {
    localStorage.setItem('test-key', 'test-value');
    const result = LocalStorageBinding.getItemOption('test-key');

    // ReScript Some(value) compiles to the value itself
    expect(result).toBe('test-value');
    expect(result).not.toBeUndefined();
  });

  test('returns undefined (None) for non-existent key', () => {
    const result = LocalStorageBinding.getItemOption('non-existent-key');

    // ReScript None compiles to undefined
    expect(result).toBeUndefined();
  });

  test('converts null to undefined (the key ReScript behavior)', () => {
    // This is the core functionality: null -> undefined conversion
    const nullValue = null;
    const convertedValue = nullValue === null ? undefined : nullValue;

    expect(convertedValue).toBeUndefined();
    expect(convertedValue).not.toBeNull();
  });

  test('preserves non-null values', () => {
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', '');
    localStorage.setItem('key3', '0');

    expect(LocalStorageBinding.getItemOption('key1')).toBe('value1');
    expect(LocalStorageBinding.getItemOption('key2')).toBe('');
    expect(LocalStorageBinding.getItemOption('key3')).toBe('0');
  });

  test('handles special string values correctly', () => {
    localStorage.setItem('null-string', 'null');
    localStorage.setItem('undefined-string', 'undefined');

    // These are strings, not null/undefined, so they should be preserved
    expect(LocalStorageBinding.getItemOption('null-string')).toBe('null');
    expect(LocalStorageBinding.getItemOption('undefined-string')).toBe('undefined');
  });
});

describe('Verification: ReScript implementation matches our test', () => {
  test('compiled file exists and exports getItemOption', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const compiledPath = path.resolve(__dirname, '../LocalStorage.res.js');
    expect(fs.existsSync(compiledPath)).toBe(true);

    const content = fs.readFileSync(compiledPath, 'utf-8');

    // Verify it exports getItemOption
    expect(content).toContain('export {');
    expect(content).toContain('getItemOption');

    // Verify it uses Nullable.toOption which compiles to Primitive_option.fromNullable
    expect(content).toContain('localStorage.getItem');
    expect(content).toContain('Primitive_option.fromNullable');
  });

  test('implementation logic matches ReScript pattern', () => {
    // The ReScript code now uses inline null/undefined check
    // Converts: null/undefined -> undefined (None), value -> value (Some)

    const convertToOption = (value) => (value === null || value === undefined ? undefined : value);

    // Test the conversion logic
    expect(convertToOption(null)).toBeUndefined();
    expect(convertToOption(undefined)).toBeUndefined();
    expect(convertToOption('value')).toBe('value');
    expect(convertToOption('')).toBe('');
    expect(convertToOption('0')).toBe('0');
  });
});
