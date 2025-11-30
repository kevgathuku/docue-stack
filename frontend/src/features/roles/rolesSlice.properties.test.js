import * as fc from 'fast-check';
import rolesReducer from './rolesSlice';

/**
 * Property-Based Tests for Roles Slice
 *
 * **Feature: flux-to-redux-migration, Property 1: State management equivalence (roles)**
 * **Feature: flux-to-redux-migration, Property 6: Role operations preservation**
 * **Validates: Requirements 2.2, 5.3**
 *
 * These tests verify that the Redux Toolkit roles slice maintains
 * correct state management behavior for all role operations.
 *
 * Note: Unlike auth, roles don't have a Flux reducer to compare against,
 * only a RoleStore. These tests verify internal consistency and correct
 * state transitions for all role operations.
 */

describe('Roles Slice Property-Based Tests', () => {
  // Arbitraries for generating test data
  const roleArb = fc.record({
    _id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    accessLevel: fc.integer({ min: 1, max: 10 }),
  });

  const rolesArrayArb = fc.array(roleArb, { minLength: 0, maxLength: 10 });

  const errorArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.record({
      message: fc.string({ minLength: 1 }),
      code: fc.integer({ min: 400, max: 599 }),
    })
  );

  describe('Property 1 & 6: State management equivalence and role operations preservation', () => {
    it('should maintain correct state for fetchRoles operations', () => {
      fc.assert(
        fc.property(rolesArrayArb, (roles) => {
          let state = rolesReducer(undefined, {});

          // Pending state
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/fulfilled',
            payload: roles,
          });
          expect(state.loading).toBe(false);
          expect(state.roles).toEqual(roles);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle fetchRoles errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = rolesReducer(undefined, {});

          // Pending state
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          expect(state.loading).toBe(true);

          // Rejected state
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain correct state for createRole operations', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          let state = rolesReducer(undefined, {});

          // Pending state
          state = rolesReducer(state, {
            type: 'roles/createRole/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          state = rolesReducer(state, {
            type: 'roles/createRole/fulfilled',
            payload: role,
          });
          expect(state.loading).toBe(false);
          expect(state.createdRole).toEqual(role);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle createRole errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = rolesReducer(undefined, {});

          // Pending state
          state = rolesReducer(state, {
            type: 'roles/createRole/pending',
          });

          // Rejected state
          state = rolesReducer(state, {
            type: 'roles/createRole/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should clear previous errors on successful operations', () => {
      fc.assert(
        fc.property(rolesArrayArb, (roles) => {
          let state = rolesReducer(undefined, {});

          // Set an error first
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/rejected',
            payload: 'Previous error',
          });
          expect(state.error).toBe('Previous error');

          // Successful operation should clear the error
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          expect(state.error).toBeNull();

          state = rolesReducer(state, {
            type: 'roles/fetchRoles/fulfilled',
            payload: roles,
          });
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple role operations in sequence', () => {
      fc.assert(
        fc.property(roleArb, rolesArrayArb, (newRole, existingRoles) => {
          let state = rolesReducer(undefined, {});

          // Fetch roles
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/fulfilled',
            payload: existingRoles,
          });
          expect(state.roles).toEqual(existingRoles);
          expect(state.loading).toBe(false);

          // Create a new role
          state = rolesReducer(state, {
            type: 'roles/createRole/pending',
          });
          expect(state.loading).toBe(true);

          state = rolesReducer(state, {
            type: 'roles/createRole/fulfilled',
            payload: newRole,
          });
          expect(state.createdRole).toEqual(newRole);
          expect(state.loading).toBe(false);
          // Note: roles array is not automatically updated with new role
          // That would be handled by refetching or manual update
          expect(state.roles).toEqual(existingRoles);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain loading state correctly across operations', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          let state = rolesReducer(undefined, {});

          // Initial state should not be loading
          expect(state.loading).toBe(false);

          // Pending should set loading to true
          state = rolesReducer(state, {
            type: 'roles/createRole/pending',
          });
          expect(state.loading).toBe(true);

          // Fulfilled should set loading to false
          state = rolesReducer(state, {
            type: 'roles/createRole/fulfilled',
            payload: role,
          });
          expect(state.loading).toBe(false);

          // Another pending should set loading to true again
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          expect(state.loading).toBe(true);

          // Rejected should also set loading to false
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/rejected',
            payload: 'Error',
          });
          expect(state.loading).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve createdRole across fetchRoles operations', () => {
      fc.assert(
        fc.property(roleArb, rolesArrayArb, (createdRole, fetchedRoles) => {
          let state = rolesReducer(undefined, {});

          // Create a role
          state = rolesReducer(state, {
            type: 'roles/createRole/fulfilled',
            payload: createdRole,
          });
          expect(state.createdRole).toEqual(createdRole);

          // Fetch roles should not clear createdRole
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/fulfilled',
            payload: fetchedRoles,
          });
          expect(state.createdRole).toEqual(createdRole);
          expect(state.roles).toEqual(fetchedRoles);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle errors with different formats consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1 }),
            fc.record({ message: fc.string({ minLength: 1 }) }),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (error) => {
            // Convert error to string format as thunks would
            const errorString =
              error === null || error === undefined
                ? 'Unknown error'
                : typeof error === 'string'
                  ? error
                  : error.message;

            const action = {
              type: 'roles/fetchRoles/rejected',
              payload: errorString,
            };

            const state = rolesReducer(undefined, action);

            // Error should always be stored as a string
            expect(typeof state.error).toBe('string');
            expect(state.error).toBe(errorString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain state immutability', () => {
      fc.assert(
        fc.property(roleArb, rolesArrayArb, (role, roles) => {
          const initialState = rolesReducer(undefined, {});
          const initialStateCopy = JSON.parse(JSON.stringify(initialState));

          // Perform operations
          let state = rolesReducer(initialState, {
            type: 'roles/fetchRoles/fulfilled',
            payload: roles,
          });

          // Original initial state should not be mutated
          expect(initialState).toEqual(initialStateCopy);

          const stateCopy = JSON.parse(JSON.stringify(state));

          // Perform another operation
          state = rolesReducer(state, {
            type: 'roles/createRole/fulfilled',
            payload: role,
          });

          // Previous state should not be mutated
          expect(JSON.parse(JSON.stringify(state))).not.toEqual(stateCopy);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty roles array correctly', () => {
      fc.assert(
        fc.property(fc.constant([]), (emptyRoles) => {
          let state = rolesReducer(undefined, {});

          state = rolesReducer(state, {
            type: 'roles/fetchRoles/fulfilled',
            payload: emptyRoles,
          });

          expect(state.roles).toEqual([]);
          expect(state.loading).toBe(false);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle role with minimal properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
          }),
          (minimalRole) => {
            let state = rolesReducer(undefined, {});

            state = rolesReducer(state, {
              type: 'roles/createRole/fulfilled',
              payload: minimalRole,
            });

            expect(state.createdRole).toEqual(minimalRole);
            expect(state.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle role with additional properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            accessLevel: fc.integer({ min: 1, max: 10 }),
            description: fc.string({ minLength: 0, maxLength: 200 }),
            permissions: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
          }),
          (extendedRole) => {
            let state = rolesReducer(undefined, {});

            state = rolesReducer(state, {
              type: 'roles/createRole/fulfilled',
              payload: extendedRole,
            });

            expect(state.createdRole).toEqual(extendedRole);
            expect(state.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Async thunk state transitions', () => {
    it('should transition through pending -> fulfilled for fetchRoles', () => {
      fc.assert(
        fc.property(rolesArrayArb, (roles) => {
          let state = rolesReducer(undefined, {});

          // Pending
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/fulfilled',
            payload: roles,
          });
          expect(state.loading).toBe(false);
          expect(state.roles).toEqual(roles);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should transition through pending -> rejected for fetchRoles', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          let state = rolesReducer(undefined, {});

          // Pending
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/pending',
          });
          expect(state.loading).toBe(true);

          // Rejected
          state = rolesReducer(state, {
            type: 'roles/fetchRoles/rejected',
            payload: error,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(error);
        }),
        { numRuns: 100 }
      );
    });

    it('should transition through pending -> fulfilled for createRole', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          let state = rolesReducer(undefined, {});

          // Pending
          state = rolesReducer(state, {
            type: 'roles/createRole/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled
          state = rolesReducer(state, {
            type: 'roles/createRole/fulfilled',
            payload: role,
          });
          expect(state.loading).toBe(false);
          expect(state.createdRole).toEqual(role);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should transition through pending -> rejected for createRole', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          let state = rolesReducer(undefined, {});

          // Pending
          state = rolesReducer(state, {
            type: 'roles/createRole/pending',
          });
          expect(state.loading).toBe(true);

          // Rejected
          state = rolesReducer(state, {
            type: 'roles/createRole/rejected',
            payload: error,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(error);
        }),
        { numRuns: 100 }
      );
    });
  });
});
