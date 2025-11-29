// Test to verify ReScript type definitions compile and export correctly

import * as AuthTypes from '../auth/AuthTypes.res.js';
import * as RoleTypes from '../roles/RoleTypes.res.js';
import * as DocumentTypes from '../documents/DocumentTypes.res.js';

describe('ReScript Type Definitions', () => {
  describe('AuthTypes', () => {
    it('should export decodeUser function', () => {
      expect(typeof AuthTypes.decodeUser).toBe('function');
    });

    it('should export decodeUsers function', () => {
      expect(typeof AuthTypes.decodeUsers).toBe('function');
    });

    it('should export encodeUser function', () => {
      expect(typeof AuthTypes.encodeUser).toBe('function');
    });

    it('should export encodeLoginCredentials function', () => {
      expect(typeof AuthTypes.encodeLoginCredentials).toBe('function');
    });

    it('should export encodeSignupData function', () => {
      expect(typeof AuthTypes.encodeSignupData).toBe('function');
    });
  });

  describe('RoleTypes', () => {
    it('should export decodeRole function', () => {
      expect(typeof RoleTypes.decodeRole).toBe('function');
    });

    it('should export decodeRoleList function', () => {
      expect(typeof RoleTypes.decodeRoleList).toBe('function');
    });

    it('should export encodeRole function', () => {
      expect(typeof RoleTypes.encodeRole).toBe('function');
    });

    it('should export encodeRoleCreateData function', () => {
      expect(typeof RoleTypes.encodeRoleCreateData).toBe('function');
    });

    it('should export AccessLevel module', () => {
      expect(typeof RoleTypes.AccessLevel).toBe('object');
      expect(RoleTypes.AccessLevel.viewer).toBe(0);
      expect(RoleTypes.AccessLevel.staff).toBe(1);
      expect(RoleTypes.AccessLevel.admin).toBe(2);
    });
  });

  describe('DocumentTypes', () => {
    it('should export decodeDocument function', () => {
      expect(typeof DocumentTypes.decodeDocument).toBe('function');
    });

    it('should export decodeDocumentList function', () => {
      expect(typeof DocumentTypes.decodeDocumentList).toBe('function');
    });

    it('should export encodeDocument function', () => {
      expect(typeof DocumentTypes.encodeDocument).toBe('function');
    });

    it('should export encodeDocumentCreateData function', () => {
      expect(typeof DocumentTypes.encodeDocumentCreateData).toBe('function');
    });

    it('should export encodeDocumentUpdateData function', () => {
      expect(typeof DocumentTypes.encodeDocumentUpdateData).toBe('function');
    });
  });

  describe('JSON Encoding/Decoding', () => {
    it('should decode a valid user object', () => {
      const userJson = {
        _id: '123',
        username: 'testuser',
        name: {
          first: 'Test',
          last: 'User'
        },
        email: 'test@example.com'
      };

      const result = AuthTypes.decodeUser(userJson);
      expect(result.TAG).toBe('Ok'); // Ok variant
      if (result.TAG === 'Ok') {
        const user = result._0;
        expect(user._id).toBe('123');
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        expect(user.name.first).toBe('Test');
        expect(user.name.last).toBe('User');
      }
    });

    it('should decode a valid role object', () => {
      const roleJson = {
        _id: '456',
        title: 'admin',
        accessLevel: 2
      };

      const result = RoleTypes.decodeRole(roleJson);
      expect(result.TAG).toBe('Ok'); // Ok variant
      if (result.TAG === 'Ok') {
        const role = result._0;
        expect(role._id).toBe('456');
        expect(role.title).toBe('admin');
        expect(role.accessLevel).toBe(2);
      }
    });

    it('should decode a valid document object', () => {
      const docJson = {
        _id: '789',
        title: 'Test Document',
        content: 'Test content',
        ownerId: '123'
      };

      const result = DocumentTypes.decodeDocument(docJson);
      expect(result.TAG).toBe('Ok'); // Ok variant
      if (result.TAG === 'Ok') {
        const doc = result._0;
        expect(doc._id).toBe('789');
        expect(doc.title).toBe('Test Document');
        expect(doc.ownerId).toBe('123');
      }
    });

    it('should handle decoding errors gracefully', () => {
      const invalidJson = { invalid: 'data' };

      const result = AuthTypes.decodeUser(invalidJson);
      expect(result.TAG).toBe('Error'); // Error variant
      if (result.TAG === 'Error') {
        expect(typeof result._0).toBe('string'); // Error message
      }
    });
  });
});
