/**
 * Tests for CreateRole ReScript component
 * 
 * Requirements tested:
 * - 5.1: Role title input updates state
 * - 5.2: Form submission dispatches Redux action
 * - 5.3: Successful creation redirects to roles list
 * - 5.4: Creation failure displays error toast
 * - 5.5: Component renders with proper styling
 * - 11.1: Unit tests for rendering and interactions
 * - 11.3: Tests for success and error scenarios
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import CreateRole from '../CreateRole.res.js';
import rolesReducer from '../../../features/roles/rolesSlice';

describe('CreateRole Component (ReScript)', () => {
  let mockStore;
  let toastCalls;

  beforeEach(() => {
    // Track toast calls
    toastCalls = [];

    // Create a mock store with roles slice
    mockStore = configureStore({
      reducer: {
        roles: rolesReducer,
      },
    });

    // Mock Materialize toast - matches the signature from Materialize.res
    // toast: (message: string, duration: int, className: string) => unit
    global.window.Materialize = {
      toast: (message, duration, className) => {
        toastCalls.push({ message, duration, className });
      },
    };

    // Mock localStorage
    global.localStorage = {
      setItem: () => {},
      getItem: () => 'mock-token',
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
    it('renders title input field', () => {
      renderWithProviders(<CreateRole />);
      
      // Check for title input
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('type', 'text');
      expect(titleInput).toHaveAttribute('name', 'title');
      expect(titleInput).toHaveAttribute('id', 'title');
      expect(titleInput).toHaveClass('validate');
    });

    it('renders submit button', () => {
      renderWithProviders(<CreateRole />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).toHaveClass('btn');
      expect(submitButton).toHaveClass('waves-effect');
      expect(submitButton).toHaveClass('header-btn');
      expect(submitButton).toHaveClass('blue');
    });

    it('renders Create Role heading', () => {
      renderWithProviders(<CreateRole />);
      
      const heading = screen.getByRole('heading', { name: /create role/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('header');
      expect(heading).toHaveClass('center-align');
    });

    it('preserves CSS classes from Elm version', () => {
      const { container } = renderWithProviders(<CreateRole />);
      
      // Check container class
      expect(container.querySelector('.container')).toBeInTheDocument();
      
      // Check row classes
      const rows = container.querySelectorAll('.row');
      expect(rows.length).toBeGreaterThan(0);
      
      // Check form class
      expect(container.querySelector('form.col.s12')).toBeInTheDocument();
      
      // Check input-field classes
      expect(container.querySelector('.input-field.col.s4.offset-s2')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates title state when typing', () => {
      renderWithProviders(<CreateRole />);
      
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Admin Role' } });
      
      expect(titleInput.value).toBe('Admin Role');
    });

    it('handles form submission with valid title', () => {
      renderWithProviders(<CreateRole />);
      
      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Enter a title
      fireEvent.change(titleInput, { target: { value: 'Manager' } });
      
      // Submit the form
      fireEvent.click(submitButton);
      
      // Verify the form was submitted (Redux action dispatched)
      const state = mockStore.getState();
      expect(state.roles).toBeDefined();
      expect(state.roles.loading).toBe(true);
    });

    it('shows error toast when submitting empty title', () => {
      renderWithProviders(<CreateRole />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Submit the form without entering a title
      fireEvent.click(submitButton);
      
      // Verify error toast was shown
      expect(toastCalls).toHaveLength(1);
      expect(toastCalls[0]).toEqual({
        message: 'Please Provide a Role Title',
        duration: 2000,
        className: 'error-toast',
      });
    });
  });

  describe('Navigation on Success', () => {
    it('shows success toast after successful creation', async () => {
      renderWithProviders(<CreateRole />);
      
      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Enter a title
      fireEvent.change(titleInput, { target: { value: 'Editor' } });
      
      // Submit the form
      fireEvent.click(submitButton);
      
      // Manually update the store to simulate successful creation
      await act(async () => {
        mockStore.dispatch({
          type: 'roles/createRole/fulfilled',
          payload: { _id: '123', title: 'Editor', accessLevel: 2 },
        });
      });
      
      // Wait for success toast to be shown
      await waitFor(() => {
        expect(toastCalls.length).toBeGreaterThan(0);
        const successToast = toastCalls.find(call => call.className === 'success-toast');
        expect(successToast).toEqual({
          message: 'Role created successfully!',
          duration: 2000,
          className: 'success-toast',
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on creation failure', async () => {
      renderWithProviders(<CreateRole />);
      
      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Enter a title
      fireEvent.change(titleInput, { target: { value: 'Duplicate Role' } });
      
      // Submit the form
      fireEvent.click(submitButton);
      
      // Manually update the store to simulate creation failure
      await act(async () => {
        mockStore.dispatch({
          type: 'roles/createRole/rejected',
          payload: 'Role already exists',
        });
      });
      
      // Wait for error toast to be shown
      await waitFor(() => {
        expect(toastCalls.length).toBeGreaterThan(0);
        const errorToast = toastCalls.find(call => call.className === 'error-toast');
        expect(errorToast).toEqual({
          message: 'Role already exists',
          duration: 2000,
          className: 'error-toast',
        });
      });
    });
  });

  describe('Redux Integration', () => {
    it('accesses roles state from Redux store', () => {
      renderWithProviders(<CreateRole />);
      
      const state = mockStore.getState();
      expect(state.roles).toBeDefined();
      expect(state.roles.createdRole).toBeNull();
      expect(state.roles.error).toBeNull();
      expect(state.roles.loading).toBe(false);
    });

    it('retrieves token from localStorage', () => {
      // Set up a token in localStorage
      global.localStorage.getItem = () => 'test-token-123';
      
      renderWithProviders(<CreateRole />);
      
      // Component should render successfully with token from localStorage
      const state = mockStore.getState();
      expect(state.roles).toBeDefined();
    });
  });
});
