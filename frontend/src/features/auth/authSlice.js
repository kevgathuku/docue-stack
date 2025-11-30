import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import request from 'superagent';
import { BASE_URL } from '../../config/api.js';

// Helper to safely load initial state from localStorage
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('user');
    const userInfo = localStorage.getItem('userInfo');

    if (token && userInfo) {
      const user = JSON.parse(userInfo);
      return {
        token,
        user,
        session: {
          loggedIn: false, // Will be validated by getSession
          loading: false,
        },
      };
    }
  } catch (error) {
    console.error('Error loading initial auth state from localStorage:', error);
  }

  return {
    token: '',
    user: {},
    session: {
      loggedIn: false,
      loading: false,
    },
  };
};

// Initial state matching the existing reducer structure exactly
const initialState = {
  users: null,
  usersError: null,
  ...loadInitialState(),
  sessionError: '',
  loginError: '',
  logoutResult: '',
  logoutError: '',
  signupError: null,
  profileUpdateResult: null,
  profileUpdateError: '',
  loggedIn: {},
};

// Async thunks for authentication operations

/**
 * Fetch all users (admin operation)
 */
export const fetchUsers = createAsyncThunk(
  'auth/fetchUsers',
  async (token, { rejectWithValue }) => {
    try {
      const result = await request.get(`${BASE_URL}/api/users`).set('x-access-token', token);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Sign up a new user
 */
export const signup = createAsyncThunk('auth/signup', async (user, { rejectWithValue }) => {
  try {
    const result = await request.post(`${BASE_URL}/api/users`).send(user);
    return result.body;
  } catch (err) {
    return rejectWithValue(err.response?.body?.error || err.message);
  }
});

/**
 * Log in an existing user
 */
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const result = await request.post(`${BASE_URL}/api/users/login`).send(credentials);
    return result.body;
  } catch (err) {
    return rejectWithValue(err.response?.body?.error || err.message);
  }
});

/**
 * Log out the current user
 * Handles API call and localStorage cleanup
 */
export const logout = createAsyncThunk('auth/logout', async (token, { rejectWithValue }) => {
  try {
    const result = await request
      .post(`${BASE_URL}/api/users/logout`)
      .set('x-access-token', token)
      .send({});

    // Clean up localStorage after successful logout
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');

    return result.body;
  } catch (err) {
    // Clean up localStorage even if API call fails
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');

    return rejectWithValue(err.response?.body?.error || err.message);
  }
});

/**
 * Get current session status
 */
export const getSession = createAsyncThunk(
  'auth/getSession',
  async (token, { rejectWithValue }) => {
    try {
      const result = await request
        .get(`${BASE_URL}/api/users/session`)
        .set('x-access-token', token);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Update user profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, payload, token }, { rejectWithValue }) => {
    try {
      const result = await request
        .put(`${BASE_URL}/api/users/${userId}`)
        .set('x-access-token', token)
        .send(payload);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions can be added here if needed
  },
  extraReducers: (builder) => {
    // Fetch users
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        state.usersError = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersError = action.payload;
      });

    // Signup
    builder
      .addCase(signup.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.signupError = null;
        state.session = {
          loggedIn: true,
          loading: false,
        };
      })
      .addCase(signup.rejected, (state, action) => {
        state.signupError = action.payload;
      });

    // Login
    builder
      .addCase(login.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.loginError = '';
        state.token = token;
        state.user = user;
        state.session = {
          loggedIn: true,
          loading: false,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.loginError = action.payload;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state, action) => {
        const { message } = action.payload;
        state.logoutError = '';
        state.token = '';
        state.user = {};
        state.session = { loggedIn: false, loading: false };
        state.logoutResult = message;
      })
      .addCase(logout.rejected, (state, action) => {
        // Clear state even on error since localStorage is already cleaned
        state.token = '';
        state.user = {};
        state.session = { loggedIn: false, loading: false };
        state.logoutError = action.payload;
      });

    // Get session
    builder
      .addCase(getSession.pending, (state) => {
        state.session = {
          loggedIn: false,
          loading: true,
        };
      })
      .addCase(getSession.fulfilled, (state, action) => {
        const { loggedIn, user } = action.payload;

        if (loggedIn) {
          state.session = {
            loggedIn: true,
            loading: false,
          };
          state.user = user;
        } else {
          state.token = '';
          state.user = {};
          state.session = {
            loggedIn: false,
            loading: false,
          };
        }
        state.sessionError = '';
      })
      .addCase(getSession.rejected, (state, action) => {
        state.sessionError = action.payload;
        state.session = {
          loggedIn: false,
          loading: false,
        };
      });

    // Update profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        state.profileUpdateError = '';

        // Update the user in the users array if it exists
        if (state.users) {
          state.users = state.users.map((user) =>
            user._id === updatedUser._id ? updatedUser : user
          );
        }

        // Update current user if it's the same user
        if (state.user._id === updatedUser._id) {
          state.user = updatedUser;
        }

        state.profileUpdateResult = updatedUser;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileUpdateError = action.payload;
      });
  },
});

// Export actions if needed in the future
// export const {} = authSlice.actions;

// Selectors
export const selectUsers = (state) => state.auth.users;
export const selectUsersError = (state) => state.auth.usersError;
export const selectSession = (state) => state.auth.session;
export const selectSessionError = (state) => state.auth.sessionError;
export const selectLoginError = (state) => state.auth.loginError;
export const selectLogoutResult = (state) => state.auth.logoutResult;
export const selectLogoutError = (state) => state.auth.logoutError;
export const selectSignupError = (state) => state.auth.signupError;
export const selectProfileUpdateResult = (state) => state.auth.profileUpdateResult;
export const selectProfileUpdateError = (state) => state.auth.profileUpdateError;
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => state.auth.session.loggedIn;
export const selectIsSessionLoading = (state) => state.auth.session.loading;

// Export reducer
export default authSlice.reducer;
