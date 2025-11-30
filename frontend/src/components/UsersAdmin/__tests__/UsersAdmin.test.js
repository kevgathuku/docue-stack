import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import authReducer from '../../../features/auth/authSlice';
import rolesReducer from '../../../features/roles/rolesSlice';
import UsersAdmin from '../UsersAdmin.jsx';

describe('UsersAdmin', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        roles: rolesReducer,
      },
    });
  });

  describe('Component Rendering', () => {
    it('renders the correct component', () => {
      const { container } = render(
        <Provider store={store}>
          <UsersAdmin />
        </Provider>
      );
      expect(container.querySelector('.container')).toBeTruthy();
      expect(screen.getByText(/Manage Users/)).toBeTruthy();
    });
  });
});
