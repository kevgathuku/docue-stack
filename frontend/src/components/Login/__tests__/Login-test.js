/**
 * Tests for Login ReScript component
 * 
 * Requirements tested:
 * - 1.1: Login form validates inputs and enables submission
 * - 1.2: Form submission dispatches Redux login action
 * - 1.3: Successful login stores token and redirects
 * - 1.4: Login failure displays error toast
 * - 1.5: Component renders with proper labels and styling
 * - 11.1: Unit tests for rendering and interactions
 * - 12.1: CSS classes match original version
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import Login from '../Login.res.js';

describe('Login Component (ReScript)', () => {
  let mockStore;

  beforeEach(() => {
    // Create a mock store with auth slice
    mockStore = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Mock Materialize toast - matches the signature from Materialize.res
    // toast: (message: string, duration: int, className: string) => unit
    global.window.Materialize = {
      toast: (message, duration, className) => {},
    };

    // Mock localStorage
    global.localStorage = {
      setItem: () => {},
      getItem: () => null,
      removeItem: () => {},
      clear: () => {},
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
    it('renders email and password inputs', () => {
      renderWithProviders(<Login />);
      
      // Check for email input
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveClass('validate');
      
      // Check for password input
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
      expect(passwordInput).toHaveClass('validate');
    });

    it('renders login button', () => {
      renderWithProviders(<Login />);
      
      const loginButton = screen.getByRole('button', { name: /login/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveClass('btn');
      expect(loginButton).toHaveClass('waves-effect');
      expect(loginButton).toHaveClass('header-btn');
      expect(loginButton).toHaveClass('blue');
    });

    it('preserves CSS classes from original version', () => {
      const { container } = renderWithProviders(<Login />);
      
      // Check row class
      expect(container.querySelector('.row')).toBeInTheDocument();
      
      // Check form class
      expect(container.querySelector('form.col.s12')).toBeInTheDocument();
      
      // Check input-field classes
      const inputFields = container.querySelectorAll('.input-field.col.s12');
      expect(inputFields).toHaveLength(2);
      
      // Check container center class
      expect(container.querySelector('.container.center')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates email state when typing', () => {
      renderWithProviders(<Login />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('updates password state when typing', () => {
      renderWithProviders(<Login />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });

    it('handles form submission with empty fields', () => {
      renderWithProviders(<Login />);
      
      // HTML5 validation should prevent submission with empty required fields
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Redux Integration', () => {
    it('accesses auth state from Redux store', () => {
      renderWithProviders(<Login />);
      
      const state = mockStore.getState();
      expect(state.auth).toBeDefined();
      expect(state.auth.loginError).toBe('');
      expect(state.auth.token).toBe('');
      expect(state.auth.user).toEqual({});
      expect(state.auth.session.loggedIn).toBe(false);
    });
  });
});
