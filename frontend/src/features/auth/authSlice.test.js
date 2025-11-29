import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  selectUsers,
  selectUsersError,
  selectSession,
  selectSessionError,
  selectLoginError,
  selectLogoutResult,
  selectLogoutError,
  selectSignupError,
  selectProfileUpdateResult,
  selectProfileUpdateError,
  selectToken,
  selectUser,
  selectIsLoggedIn,
  selectIsSessionLoading,
} from './authSlice';

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        users: null,
        usersError: null,
        session: {
          loggedIn: false,
          loading: false,
        },
        sessionError: '',
        loginError: '',
        logoutResult: '',
        logoutError: '',
        signupError: null,
        profileUpdateResult: null,
        profileUpdateError: '',
        token: '',
        user: {},
        loggedIn: {},
      });
    });
  });

  describe('reducer logic', () => {
    it('should handle fetchUsers.fulfilled', () => {
      const mockUsers = [
        { _id: '1', username: 'user1' },
        { _id: '2', username: 'user2' },
      ];

      const action = {
        type: 'auth/fetchUsers/fulfilled',
        payload: mockUsers,
      };

      const newState = authReducer(undefined, action);
      expect(newState.users).toEqual(mockUsers);
      expect(newState.usersError).toBeNull();
    });

    it('should handle fetchUsers.rejected', () => {
      const mockError = 'Failed to fetch users';

      const action = {
        type: 'auth/fetchUsers/rejected',
        payload: mockError,
      };

      const newState = authReducer(undefined, action);
      expect(newState.usersError).toBe(mockError);
    });

    it('should handle signup.fulfilled', () => {
      const mockResponse = {
        token: 'new-token',
        user: { _id: '1', username: 'newuser' },
      };

      const action = {
        type: 'auth/signup/fulfilled',
        payload: mockResponse,
      };

      const newState = authReducer(undefined, action);
      expect(newState.token).toBe('new-token');
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.signupError).toBeNull();
    });

    it('should handle signup.rejected', () => {
      const mockError = 'Username already exists';

      const action = {
        type: 'auth/signup/rejected',
        payload: mockError,
      };

      const newState = authReducer(undefined, action);
      expect(newState.signupError).toBe(mockError);
    });

    it('should handle login.fulfilled', () => {
      const mockResponse = {
        token: 'login-token',
        user: { _id: '1', username: 'testuser' },
      };

      const action = {
        type: 'auth/login/fulfilled',
        payload: mockResponse,
      };

      const newState = authReducer(undefined, action);
      expect(newState.token).toBe('login-token');
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.loginError).toBe('');
    });

    it('should handle login.rejected', () => {
      const mockError = 'Invalid credentials';

      const action = {
        type: 'auth/login/rejected',
        payload: mockError,
      };

      const newState = authReducer(undefined, action);
      expect(newState.loginError).toBe(mockError);
    });

    it('should clear previous login error on successful login', () => {
      // First, set an error
      const errorAction = {
        type: 'auth/login/rejected',
        payload: 'Invalid credentials',
      };
      let state = authReducer(undefined, errorAction);
      expect(state.loginError).toBe('Invalid credentials');

      // Then login successfully
      const successAction = {
        type: 'auth/login/fulfilled',
        payload: {
          token: 'login-token',
          user: { _id: '1', username: 'testuser' },
        },
      };
      state = authReducer(state, successAction);
      expect(state.loginError).toBe('');
    });

    it('should handle logout.fulfilled', () => {
      // Start with logged in state
      const initialState = {
        ...authReducer(undefined, {}),
        token: 'login-token',
        user: { _id: '1', username: 'testuser' },
      };

      const action = {
        type: 'auth/logout/fulfilled',
        payload: { message: 'Logged out successfully' },
      };

      const newState = authReducer(initialState, action);
      expect(newState.token).toBe('');
      expect(newState.user).toEqual({});
      expect(newState.logoutResult).toBe('Logged out successfully');
      expect(newState.logoutError).toBe('');
    });

    it('should handle logout.rejected', () => {
      const mockError = 'Logout failed';

      const action = {
        type: 'auth/logout/rejected',
        payload: mockError,
      };

      const newState = authReducer(undefined, action);
      expect(newState.logoutError).toBe(mockError);
    });

    it('should handle getSession.pending', () => {
      const action = {
        type: 'auth/getSession/pending',
      };

      const newState = authReducer(undefined, action);
      expect(newState.session.loading).toBe(true);
      expect(newState.session.loggedIn).toBe(false);
    });

    it('should handle getSession.fulfilled when logged in', () => {
      const mockResponse = {
        loggedIn: true,
        user: { _id: '1', username: 'testuser' },
      };

      const action = {
        type: 'auth/getSession/fulfilled',
        payload: mockResponse,
      };

      const newState = authReducer(undefined, action);
      expect(newState.session.loggedIn).toBe(true);
      expect(newState.session.loading).toBe(false);
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.sessionError).toBe('');
    });

    it('should handle getSession.fulfilled when not logged in', () => {
      const mockResponse = {
        loggedIn: false,
      };

      const action = {
        type: 'auth/getSession/fulfilled',
        payload: mockResponse,
      };

      const newState = authReducer(undefined, action);
      expect(newState.session.loggedIn).toBe(false);
      expect(newState.session.loading).toBe(false);
      expect(newState.token).toBe('');
      expect(newState.user).toEqual({});
    });

    it('should handle getSession.rejected', () => {
      const mockError = 'Session check failed';

      const action = {
        type: 'auth/getSession/rejected',
        payload: mockError,
      };

      const newState = authReducer(undefined, action);
      expect(newState.sessionError).toBe(mockError);
      expect(newState.session.loggedIn).toBe(false);
      expect(newState.session.loading).toBe(false);
    });

    it('should handle updateProfile.fulfilled', () => {
      const initialState = {
        ...authReducer(undefined, {}),
        users: [
          { _id: '1', username: 'user1', email: 'old@email.com' },
          { _id: '2', username: 'user2', email: 'user2@email.com' },
        ],
      };

      const updatedUser = {
        _id: '1',
        username: 'user1',
        email: 'new@email.com',
      };

      const action = {
        type: 'auth/updateProfile/fulfilled',
        payload: updatedUser,
      };

      const newState = authReducer(initialState, action);
      expect(newState.profileUpdateError).toBe('');
      expect(newState.users[0]).toEqual(updatedUser);
      expect(newState.profileUpdateResult).toEqual(updatedUser);
    });

    it('should update current user if updating own profile', () => {
      const initialState = {
        ...authReducer(undefined, {}),
        user: { _id: '1', username: 'testuser', email: 'old@email.com' },
      };

      const updatedUser = {
        _id: '1',
        username: 'testuser',
        email: 'new@email.com',
      };

      const action = {
        type: 'auth/updateProfile/fulfilled',
        payload: updatedUser,
      };

      const newState = authReducer(initialState, action);
      expect(newState.user).toEqual(updatedUser);
    });

    it('should handle updateProfile.rejected', () => {
      const mockError = 'Update failed';

      const action = {
        type: 'auth/updateProfile/rejected',
        payload: mockError,
      };

      const newState = authReducer(undefined, action);
      expect(newState.profileUpdateError).toBe(mockError);
    });
  });

  describe('selectors', () => {
    it('should select users', () => {
      const mockUsers = [{ _id: '1', username: 'user1' }];
      const state = { auth: { ...store.getState().auth, users: mockUsers } };
      expect(selectUsers(state)).toEqual(mockUsers);
    });

    it('should select usersError', () => {
      const mockError = 'Error message';
      const state = {
        auth: { ...store.getState().auth, usersError: mockError },
      };
      expect(selectUsersError(state)).toBe(mockError);
    });

    it('should select session', () => {
      const mockSession = { loggedIn: true, loading: false };
      const state = { auth: { ...store.getState().auth, session: mockSession } };
      expect(selectSession(state)).toEqual(mockSession);
    });

    it('should select sessionError', () => {
      const mockError = 'Session error';
      const state = {
        auth: { ...store.getState().auth, sessionError: mockError },
      };
      expect(selectSessionError(state)).toBe(mockError);
    });

    it('should select loginError', () => {
      const mockError = 'Login error';
      const state = { auth: { ...store.getState().auth, loginError: mockError } };
      expect(selectLoginError(state)).toBe(mockError);
    });

    it('should select logoutResult', () => {
      const mockResult = 'Logged out';
      const state = {
        auth: { ...store.getState().auth, logoutResult: mockResult },
      };
      expect(selectLogoutResult(state)).toBe(mockResult);
    });

    it('should select logoutError', () => {
      const mockError = 'Logout error';
      const state = {
        auth: { ...store.getState().auth, logoutError: mockError },
      };
      expect(selectLogoutError(state)).toBe(mockError);
    });

    it('should select signupError', () => {
      const mockError = 'Signup error';
      const state = {
        auth: { ...store.getState().auth, signupError: mockError },
      };
      expect(selectSignupError(state)).toBe(mockError);
    });

    it('should select profileUpdateResult', () => {
      const mockResult = { _id: '1', username: 'updated' };
      const state = {
        auth: { ...store.getState().auth, profileUpdateResult: mockResult },
      };
      expect(selectProfileUpdateResult(state)).toEqual(mockResult);
    });

    it('should select profileUpdateError', () => {
      const mockError = 'Update error';
      const state = {
        auth: { ...store.getState().auth, profileUpdateError: mockError },
      };
      expect(selectProfileUpdateError(state)).toBe(mockError);
    });

    it('should select token', () => {
      const mockToken = 'test-token';
      const state = { auth: { ...store.getState().auth, token: mockToken } };
      expect(selectToken(state)).toBe(mockToken);
    });

    it('should select user', () => {
      const mockUser = { _id: '1', username: 'testuser' };
      const state = { auth: { ...store.getState().auth, user: mockUser } };
      expect(selectUser(state)).toEqual(mockUser);
    });

    it('should select isLoggedIn', () => {
      const state = {
        auth: {
          ...store.getState().auth,
          session: { loggedIn: true, loading: false },
        },
      };
      expect(selectIsLoggedIn(state)).toBe(true);
    });

    it('should select isSessionLoading', () => {
      const state = {
        auth: {
          ...store.getState().auth,
          session: { loggedIn: false, loading: true },
        },
      };
      expect(selectIsSessionLoading(state)).toBe(true);
    });
  });
});
