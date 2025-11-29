import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import documentsReducer from '../features/documents/documentsSlice';

// Placeholder reducers - will be replaced with actual slices in subsequent tasks
const placeholderRolesReducer = (state = {}, action) => state;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    roles: placeholderRolesReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export const RootState = store.getState;
export const AppDispatch = store.dispatch;
