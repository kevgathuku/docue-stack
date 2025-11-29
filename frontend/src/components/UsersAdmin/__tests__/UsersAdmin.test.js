'use strict';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import UsersAdmin from '../UsersAdmin.jsx';
import authReducer from '../../../features/auth/authSlice';
import rolesReducer from '../../../features/roles/rolesSlice';

describe('UsersAdmin', function() {
  let store;

  beforeEach(function() {
    store = configureStore({
      reducer: {
        auth: authReducer,
        roles: rolesReducer,
      },
    });
  });

  describe('Component Rendering', function() {
    it('renders the correct component', function() {
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
