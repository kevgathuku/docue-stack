'use strict';

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import NavBar from '../NavBar.jsx';

describe('NavBar', function() {
  let mockStore;

  beforeEach(function() {
    // Create a mock store with auth slice
    mockStore = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Mock jQuery functions
    window.$ = jest.fn((selector) => ({
      dropdown: jest.fn(),
      sideNav: jest.fn(),
    }));

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  const renderWithProviders = (component, pathname = '/dashboard') => {
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
    it('renders the correct mobile links', function() {
      renderWithProviders(<NavBar pathname="/dashboard" />);
      
      // It should find the correct title
      expect(screen.getByText(/Docue/i)).toBeInTheDocument();
      // It should render the correct menu items
      expect(screen.getByText(/Home/i)).toBeInTheDocument();
    });

    it('renders the site logo', function() {
      const { container } = renderWithProviders(<NavBar pathname="/dashboard" />);
      
      // It should render the site logo
      const logo = container.querySelector('#header-logo');
      expect(logo).toBeInTheDocument();
      expect(logo.tagName).toBe('IMG');
    });

    it('does not render when pathname is /', function() {
      const { container } = renderWithProviders(<NavBar pathname="/" />);
      
      // Should not render the nav when on home page
      expect(container.querySelector('nav')).not.toBeInTheDocument();
    });
  });

  describe('Redux Integration', function() {
    it('should access auth state from Redux store', function() {
      renderWithProviders(<NavBar pathname="/dashboard" />);
      
      const state = mockStore.getState();
      expect(state.auth).toBeDefined();
      expect(state.auth.token).toBe('');
      expect(state.auth.user).toEqual({});
      expect(state.auth.session.loggedIn).toBe(false);
    });

    it('should render login links when not logged in', function() {
      renderWithProviders(<NavBar pathname="/dashboard" />);
      
      // Should show login/signup links when not logged in
      const loginLinks = screen.getAllByText(/Login/i);
      expect(loginLinks.length).toBeGreaterThan(0);
    });
  });
});
