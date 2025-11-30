import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import request from 'superagent';
import { BASE_URL } from '../../config/api.js';

// Initial state matching the RoleStore structure
const initialState = {
  createdRole: null,
  roles: null,
  loading: false,
  error: null,
};

// Async thunks for role operations

/**
 * Fetch all roles
 */
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (token, { rejectWithValue }) => {
    try {
      const result = await request.get(`${BASE_URL}/api/roles`).set('x-access-token', token);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Create a new role
 */
export const createRole = createAsyncThunk(
  'roles/createRole',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const result = await request
        .post(`${BASE_URL}/api/roles`)
        .set('x-access-token', token)
        .send(data);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

// Roles slice
const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    // Synchronous actions can be added here if needed
  },
  extraReducers: (builder) => {
    // Fetch roles
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create role
    builder
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.createdRole = action.payload;
        state.error = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions if needed in the future
// export const {} = rolesSlice.actions;

// Selectors
export const selectRoles = (state) => state.roles.roles;
export const selectCreatedRole = (state) => state.roles.createdRole;
export const selectRolesLoading = (state) => state.roles.loading;
export const selectRolesError = (state) => state.roles.error;

// Export reducer
export default rolesSlice.reducer;
