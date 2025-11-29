import { configureStore } from '@reduxjs/toolkit';
import rolesReducer, {
  selectRoles,
  selectCreatedRole,
  selectRolesLoading,
  selectRolesError,
} from './rolesSlice';

describe('rolesSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        roles: rolesReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().roles;
      expect(state).toEqual({
        createdRole: null,
        roles: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('reducer logic', () => {
    describe('fetchRoles', () => {
      it('should handle fetchRoles.pending', () => {
        const action = {
          type: 'roles/fetchRoles/pending',
        };

        const newState = rolesReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle fetchRoles.fulfilled', () => {
        const mockRoles = [
          { _id: '1', title: 'Admin', accessLevel: 1 },
          { _id: '2', title: 'User', accessLevel: 2 },
        ];

        const action = {
          type: 'roles/fetchRoles/fulfilled',
          payload: mockRoles,
        };

        const newState = rolesReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.roles).toEqual(mockRoles);
        expect(newState.error).toBeNull();
      });

      it('should handle fetchRoles.rejected', () => {
        const mockError = 'Failed to fetch roles';

        const action = {
          type: 'roles/fetchRoles/rejected',
          payload: mockError,
        };

        const newState = rolesReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });

      it('should clear previous error on successful fetch', () => {
        // First, set an error
        const errorAction = {
          type: 'roles/fetchRoles/rejected',
          payload: 'Previous error',
        };
        let state = rolesReducer(undefined, errorAction);
        expect(state.error).toBe('Previous error');

        // Then fetch successfully
        const successAction = {
          type: 'roles/fetchRoles/fulfilled',
          payload: [{ _id: '1', title: 'Admin' }],
        };
        state = rolesReducer(state, successAction);
        expect(state.error).toBeNull();
      });
    });

    describe('createRole', () => {
      it('should handle createRole.pending', () => {
        const action = {
          type: 'roles/createRole/pending',
        };

        const newState = rolesReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle createRole.fulfilled', () => {
        const mockRole = {
          _id: '3',
          title: 'Moderator',
          accessLevel: 3,
        };

        const action = {
          type: 'roles/createRole/fulfilled',
          payload: mockRole,
        };

        const newState = rolesReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.createdRole).toEqual(mockRole);
        expect(newState.error).toBeNull();
      });

      it('should handle createRole.rejected', () => {
        const mockError = 'Failed to create role';

        const action = {
          type: 'roles/createRole/rejected',
          payload: mockError,
        };

        const newState = rolesReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });

      it('should clear previous error on successful creation', () => {
        // First, set an error
        const errorAction = {
          type: 'roles/createRole/rejected',
          payload: 'Previous error',
        };
        let state = rolesReducer(undefined, errorAction);
        expect(state.error).toBe('Previous error');

        // Then create successfully
        const successAction = {
          type: 'roles/createRole/fulfilled',
          payload: { _id: '1', title: 'Admin' },
        };
        state = rolesReducer(state, successAction);
        expect(state.error).toBeNull();
      });
    });
  });

  describe('selectors', () => {
    it('should select roles', () => {
      const mockRoles = [
        { _id: '1', title: 'Admin' },
        { _id: '2', title: 'User' },
      ];
      const state = { roles: { ...store.getState().roles, roles: mockRoles } };
      expect(selectRoles(state)).toEqual(mockRoles);
    });

    it('should select createdRole', () => {
      const mockRole = { _id: '1', title: 'Admin' };
      const state = {
        roles: { ...store.getState().roles, createdRole: mockRole },
      };
      expect(selectCreatedRole(state)).toEqual(mockRole);
    });

    it('should select loading state', () => {
      const state = { roles: { ...store.getState().roles, loading: true } };
      expect(selectRolesLoading(state)).toBe(true);
    });

    it('should select error', () => {
      const mockError = 'Error message';
      const state = { roles: { ...store.getState().roles, error: mockError } };
      expect(selectRolesError(state)).toBe(mockError);
    });
  });
});
