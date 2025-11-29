'use strict';

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import Auth from '../Auth.jsx';

// Mock store for testing
const mockStore = configureStore({
  reducer: {
    auth: authReducer,
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
      
      // It should find the tabs
      expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Signup/i).length).toBeGreaterThan(0);
    });

    it('renders the correct component structure', function() {
      const { container } = render(<Auth />, { wrapper: Wrapper });
      
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.card-panel')).toBeInTheDocument();
    });
  });
});
