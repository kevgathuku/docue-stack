'use strict';

import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import Login from '../Login.jsx';

// Mock Elm module
jest.mock('../../Login.elm', () => ({
  Elm: {
    Login: {
      init: jest.fn(() => ({
        ports: {
          handleSubmit: {
            subscribe: jest.fn(),
          },
        },
      })),
    },
  },
}));

describe('Login', function() {
  let mockStore;

  beforeEach(function() {
    // Create a mock store with auth slice
    mockStore = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Mock Materialize toast
    window.Materialize = {
      toast: jest.fn(),
    };
  });

  const renderWithProviders = (component) => {
    return render(
      <Provider store={mockStore}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Component Rendering', function() {
    it('renders the Login component', function() {
      const { container } = renderWithProviders(<Login />);
      expect(container).toBeInTheDocument();
    });

    it('uses Redux state for authentication', function() {
      const { container } = renderWithProviders(<Login />);
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument();
      
      // Verify the store has the correct initial state
      const state = mockStore.getState();
      expect(state.auth.loginError).toBe('');
      expect(state.auth.token).toBe('');
      expect(state.auth.user).toEqual({});
    });
  });

  describe('Redux Integration', function() {
    it('should access auth state from Redux store', function() {
      renderWithProviders(<Login />);
      
      const state = mockStore.getState();
      expect(state.auth).toBeDefined();
      expect(state.auth.session).toBeDefined();
      expect(state.auth.session.loggedIn).toBe(false);
    });
  });
});
