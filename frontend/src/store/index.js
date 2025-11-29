import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../stores/reducer';

// Placeholder reducers - will be replaced with actual slices in subsequent tasks
const placeholderDocumentsReducer = (state = {}, action) => state;
const placeholderRolesReducer = (state = {}, action) => state;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: placeholderDocumentsReducer,
    roles: placeholderRolesReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export const RootState = store.getState;
export const AppDispatch = store.dispatch;
