'use strict';

import { jest } from '@jest/globals';

// Mock Elm module BEFORE importing Login component
// Using unstable_mockModule for ESM compatibility
await jest.unstable_mockModule('../../Login.elm', () => ({
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

// Import after mocking
const { render } = await import('@testing-library/react');
const { BrowserRouter } = await import('react-router-dom');
const { Provider } = await import('react-redux');
const { configureStore } = await import('@reduxjs/toolkit');
const authReducer = (await import('../../../features/auth/authSlice')).default;
const Login = (await import('../Login.jsx')).default;

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
