describe('Utils Spec', () => {
  const {
    isDocumentOwner,
    canAccessDocument,
    canDeleteDocument,
  } = require('../server/controllers/utils');

  describe('isDocumentOwner', () => {
    it('should return true when user ID matches document owner ID', () => {
      const userId = '507f1f77bcf86cd799439011';
      const ownerId = '507f1f77bcf86cd799439011';

      expect(isDocumentOwner(userId, ownerId)).toBe(true);
    });

    it('should return false when user ID does not match document owner ID', () => {
      const userId = '507f1f77bcf86cd799439011';
      const ownerId = '507f1f77bcf86cd799439012';

      expect(isDocumentOwner(userId, ownerId)).toBe(false);
    });

    it('should handle ObjectId comparison correctly', () => {
      // Simulate ObjectId objects with toString method
      const userId = { toString: () => '507f1f77bcf86cd799439011' };
      const ownerId = { toString: () => '507f1f77bcf86cd799439011' };

      expect(isDocumentOwner(userId, ownerId)).toBe(true);
    });

    it('should handle mixed string and ObjectId comparison', () => {
      const userId = '507f1f77bcf86cd799439011';
      const ownerId = { toString: () => '507f1f77bcf86cd799439011' };

      expect(isDocumentOwner(userId, ownerId)).toBe(true);
    });

    it('should handle populated ownerId (User object with _id)', () => {
      const userId = '507f1f77bcf86cd799439011';
      // Simulate a populated ownerId (full User object)
      const populatedOwnerId = {
        _id: '507f1f77bcf86cd799439011',
        name: { first: 'John', last: 'Doe' },
        email: 'john@example.com',
        toString: () => '[object Object]', // This is what causes the bug
      };

      expect(isDocumentOwner(userId, populatedOwnerId)).toBe(true);
    });

    it('should handle populated ownerId with non-matching ID', () => {
      const userId = '507f1f77bcf86cd799439011';
      const populatedOwnerId = {
        _id: '507f1f77bcf86cd799439012',
        name: { first: 'Jane', last: 'Doe' },
        toString: () => '[object Object]',
      };

      expect(isDocumentOwner(userId, populatedOwnerId)).toBe(false);
    });
  });

  describe('canAccessDocument', () => {
    it('should allow access if user is the owner', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 0 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439011',
        role: { accessLevel: 2 },
      };

      expect(canAccessDocument(user, document)).toBe(true);
    });

    it('should allow access if user has sufficient access level', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 2 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
        role: { accessLevel: 1 },
      };

      expect(canAccessDocument(user, document)).toBe(true);
    });

    it('should allow access if user has equal access level', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 1 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
        role: { accessLevel: 1 },
      };

      expect(canAccessDocument(user, document)).toBe(true);
    });

    it('should deny access if user has insufficient access level', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 0 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
        role: { accessLevel: 2 },
      };

      expect(canAccessDocument(user, document)).toBe(false);
    });

    it('should deny access if role information is missing', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
      };

      expect(canAccessDocument(user, document)).toBe(false);
    });

    it('should allow access when ownerId is populated (User object)', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 0 },
      };
      const document = {
        ownerId: {
          _id: '507f1f77bcf86cd799439011',
          name: { first: 'John', last: 'Doe' },
          toString: () => '[object Object]',
        },
        role: { accessLevel: 2 },
      };

      expect(canAccessDocument(user, document)).toBe(true);
    });
  });

  describe('canDeleteDocument', () => {
    it('should allow deletion if user is the owner', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 0 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439011',
      };

      expect(canDeleteDocument(user, document)).toBe(true);
    });

    it('should allow deletion if user is an admin (accessLevel 2)', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 2 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
      };

      expect(canDeleteDocument(user, document)).toBe(true);
    });

    it('should deny deletion if user is not owner and not admin', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        role: { accessLevel: 1 },
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
      };

      expect(canDeleteDocument(user, document)).toBe(false);
    });

    it('should deny deletion if user has no role', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
      };
      const document = {
        ownerId: '507f1f77bcf86cd799439012',
      };

      expect(canDeleteDocument(user, document)).toBe(false);
    });
  });
});
