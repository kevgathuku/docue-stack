import { jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import documentsReducer from '../../../features/documents/documentsSlice';
import rolesReducer from '../../../features/roles/rolesSlice';
import CreateDocument from '../index.jsx';

describe('CreateDocument', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        documents: documentsReducer,
        roles: rolesReducer,
      },
      preloadedState: {
        documents: {
          doc: null,
          docs: null,
          docCreateResult: null,
          docDeleteResult: null,
          docEditResult: null,
          loading: false,
          error: null,
        },
        roles: {
          roles: [
            { _id: '1', title: 'viewer', accessLevel: 0 },
            { _id: '2', title: 'admin', accessLevel: 2 },
          ],
          createdRole: null,
          loading: false,
          error: null,
        },
      },
    });

    // Set up localStorage
    localStorage.setItem('user', 'test-token');

    // Mock Materialize toast
    window.Materialize = {
      toast: jest.fn(),
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('displays the correct contents', () => {
      render(
        <BrowserRouter>
          <Provider store={store}>
            <CreateDocument />
          </Provider>
        </BrowserRouter>
      );
      expect(screen.getByText(/Create Document/i)).toBeInTheDocument();
    });

    it('renders the correct component', () => {
      const { container } = render(
        <BrowserRouter>
          <Provider store={store}>
            <CreateDocument />
          </Provider>
        </BrowserRouter>
      );
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelectorAll('.input-field').length).toBeGreaterThanOrEqual(2);
    });

    it('renders form fields', () => {
      render(
        <BrowserRouter>
          <Provider store={store}>
            <CreateDocument />
          </Provider>
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Component Functions', () => {
    it('should update title field on change', () => {
      render(
        <BrowserRouter>
          <Provider store={store}>
            <CreateDocument />
          </Provider>
        </BrowserRouter>
      );

      const titleInput = screen.getByLabelText(/Title/i);
      fireEvent.change(titleInput, { target: { name: 'title', value: 'Test Title' } });

      expect(titleInput.value).toBe('Test Title');
    });

    it('should update content field on change', () => {
      render(
        <BrowserRouter>
          <Provider store={store}>
            <CreateDocument />
          </Provider>
        </BrowserRouter>
      );

      const contentInput = screen.getByLabelText(/Content/i);
      fireEvent.change(contentInput, { target: { name: 'content', value: 'Test Content' } });

      expect(contentInput.value).toBe('Test Content');
    });

    it('should show error toast when submitting without a role', () => {
      render(
        <BrowserRouter>
          <Provider store={store}>
            <CreateDocument />
          </Provider>
        </BrowserRouter>
      );

      const form = screen.getByRole('button', { name: /submit/i }).closest('form');
      fireEvent.submit(form);

      expect(window.Materialize.toast).toHaveBeenCalledWith(
        'Please Select a Role',
        2000,
        'error-toast'
      );
    });
  });
});
