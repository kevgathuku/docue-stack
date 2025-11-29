import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import documentsReducer from '../features/documents/documentsSlice';
import rolesReducer from '../features/roles/rolesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    roles: rolesReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export const RootState = store.getState;
export const AppDispatch = store.dispatch;
