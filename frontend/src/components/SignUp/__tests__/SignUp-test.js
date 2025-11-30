import { jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../../../features/auth/authSlice';
import SignUp from '../SignUp.res.js';

describe('SignUp', () => {
  let mockStore;

  beforeEach(() => {
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

  describe('Component Rendering', () => {
    it('displays the correct contents', () => {
      renderWithProviders(<SignUp />);

      // It should find the correct content
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
    });

    it('renders the correct form fields', () => {
      renderWithProviders(<SignUp />);

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('should access auth state from Redux store', () => {
      renderWithProviders(<SignUp />);

      const state = mockStore.getState();
      expect(state.auth).toBeDefined();
      expect(state.auth.signupError).toBeNull();
      expect(state.auth.token).toBe('');
      expect(state.auth.user).toEqual({});
    });

    it('should use Redux session state', () => {
      renderWithProviders(<SignUp />);

      const state = mockStore.getState();
      expect(state.auth.session).toBeDefined();
      expect(state.auth.session.loggedIn).toBe(false);
    });
  });
});
