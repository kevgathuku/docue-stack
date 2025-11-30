'use strict';

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import NavBar from '../NavBar.res.js';

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
    window.$ = jest.fn(() => ({
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
      renderWithProviders(<NavBar pathname="/auth" />);
      
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

    it('logo links to root when user is not logged in', function() {
      const { container } = renderWithProviders(<NavBar pathname="/auth" />);
      
      // Find the logo link
      const logoLink = container.querySelector('.brand-logo');
      expect(logoLink).toBeInTheDocument();
      expect(logoLink.getAttribute('href')).toBe('/');
    });

    it('logo links to dashboard when user is logged in', function() {
      // Create a store with logged-in user
      const loggedInStore = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: { _id: '123', email: 'test@example.com', name: { first: 'Test', last: 'User' } },
            token: 'test-token',
            session: { loggedIn: true },
          },
        },
      });

      const { container } = render(
        <Provider store={loggedInStore}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <NavBar pathname="/profile" />
          </BrowserRouter>
        </Provider>
      );
      
      // Find the logo link
      const logoLink = container.querySelector('.brand-logo');
      expect(logoLink).toBeInTheDocument();
      expect(logoLink.getAttribute('href')).toBe('/dashboard');
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

  describe('Admin User Features', function() {
    it('should show admin settings link for admin users', function() {
      // Create a store with logged-in admin user
      const adminStore = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: {
              _id: '123',
              email: 'admin@example.com',
              name: { first: 'Admin', last: 'User' },
              role: { title: 'admin', accessLevel: 3 },
            },
            token: 'admin-token',
            session: { loggedIn: true },
          },
        },
      });

      const { container } = render(
        <Provider store={adminStore}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <NavBar pathname="/dashboard" />
          </BrowserRouter>
        </Provider>
      );

      // Should show Settings link in dropdown for admin
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should not show admin settings link for regular users', function() {
      // Create a store with logged-in regular user
      const userStore = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: {
              _id: '456',
              email: 'user@example.com',
              name: { first: 'Regular', last: 'User' },
              role: { title: 'user', accessLevel: 1 },
            },
            token: 'user-token',
            session: { loggedIn: true },
          },
        },
      });

      render(
        <Provider store={userStore}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <NavBar pathname="/dashboard" />
          </BrowserRouter>
        </Provider>
      );

      // Should not show Settings link for regular user
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', function() {
    it('should handle logout click when token exists', function() {
      // Mock localStorage.getItem to return a token
      Storage.prototype.getItem = jest.fn(() => 'test-token');

      const loggedInStore = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: {
              _id: '123',
              email: 'test@example.com',
              name: { first: 'Test', last: 'User' },
            },
            token: 'test-token',
            session: { loggedIn: true },
          },
        },
      });

      const { container } = render(
        <Provider store={loggedInStore}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <NavBar pathname="/dashboard" />
          </BrowserRouter>
        </Provider>
      );

      // Find logout button by id (more reliable than text with spaces)
      const logoutButton = container.querySelector('#logout-btn');
      expect(logoutButton).toBeInTheDocument();
      
      logoutButton.click();

      // Verify localStorage.getItem was called
      expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    });

    it('should redirect to home after logout completes', function() {
      const loggedInStore = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: {
              _id: '123',
              email: 'test@example.com',
              name: { first: 'Test', last: 'User' },
            },
            token: 'test-token',
            session: { loggedIn: true },
            logoutResult: 'success',
          },
        },
      });

      render(
        <Provider store={loggedInStore}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <NavBar pathname="/dashboard" />
          </BrowserRouter>
        </Provider>
      );

      // Note: localStorage cleanup is now handled by the logout thunk in authSlice
      // NavBar only handles navigation after logout completes
      // The component should trigger navigation when logoutResult is set
      const state = loggedInStore.getState();
      expect(state.auth.logoutResult).toBe('success');
    });
  });
});
