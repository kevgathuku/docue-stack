'use strict';

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Auth from '../Auth.jsx';

// Mock store for testing
const mockStore = configureStore({
  reducer: {
    // Minimal reducer for testing
    session: () => ({ loggedIn: false, loading: false }),
    user: () => ({}),
    token: () => '',
  },
});

// Wrapper component for Router and Redux
const Wrapper = ({ children }) => (
  <Provider store={mockStore}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {children}
    </BrowserRouter>
  </Provider>
);

describe('Auth', function() {
  describe('Component Rendering', function() {
    it('displays the correct contents', function() {
      render(<Auth />, { wrapper: Wrapper });
      
      // It should find the correct content
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Signup/i)).toBeInTheDocument();
    });

    it('renders the correct component structure', function() {
      const { container } = render(<Auth />, { wrapper: Wrapper });
      
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.card-panel')).toBeInTheDocument();
    });
  });
});
