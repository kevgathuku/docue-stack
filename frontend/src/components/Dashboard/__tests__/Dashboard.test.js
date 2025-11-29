'use strict';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../index.jsx';
import documentsReducer from '../../../features/documents/documentsSlice';

describe('Dashboard', function() {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        documents: documentsReducer,
      },
    });
    
    // Set up localStorage with a token by default
    localStorage.setItem('user', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', function() {
    it('displays the correct contents', function() {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      expect(screen.getByText(/All Documents/i)).toBeInTheDocument();
    });

    it('renders the correct component', function() {
      const { container } = render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.fixed-action-btn')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('shows error when no token is present', () => {
      // Clear localStorage
      localStorage.removeItem('user');
      
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );
      
      expect(screen.getByText(/No authentication token found/i)).toBeInTheDocument();
    });
  });
});
