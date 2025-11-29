import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import expect from 'expect';
import CreateRole from '../CreateRole.jsx';
import rolesReducer from '../../../features/roles/rolesSlice';

describe('CreateRole', function() {
  let store;

  beforeEach(function() {
    store = configureStore({
      reducer: {
        roles: rolesReducer,
      },
    });
  });

  describe('Component Rendering', function() {
    it('renders without crashing', function() {
      const { container } = render(
        <Provider store={store}>
          <BrowserRouter>
            <CreateRole />
          </BrowserRouter>
        </Provider>
      );
      // Component renders (Elm integration is mocked)
      expect(container).toBeTruthy();
    });
  });
});
