import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import documentsReducer from '../features/documents/documentsSlice';
import rolesReducer from '../features/roles/rolesSlice';

// Vite uses import.meta.env instead of process.env
const isDevelopment = import.meta.env.MODE !== 'production';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    roles: rolesReducer,
  },
  // Enable Redux DevTools Extension
  // configureStore enables DevTools by default in development
  // We can customize it with additional options
  devTools: isDevelopment && {
    name: 'Docue App',
    trace: true,
    traceLimit: 25,
  },
});

// Log store creation for debugging
if (isDevelopment) {
  console.log('[Redux Store] Store created successfully');
  console.log('[Redux Store] Initial state:', store.getState());
  console.log('[Redux Store] DevTools enabled:', !!window.__REDUX_DEVTOOLS_EXTENSION__);
}

export const RootState = store.getState;
export const AppDispatch = store.dispatch;
