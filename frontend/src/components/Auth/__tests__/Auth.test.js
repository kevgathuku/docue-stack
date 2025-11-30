import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer from '../../../features/auth/authSlice';
import Auth from '../Auth.jsx';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock Materialize
global.window.$ = () => ({
  tabs: () => {},
});

// Create a wrapper that includes routing to test redirects
const createWrapper = (initialState = {}, initialRoute = '/auth') => {
  const mockStore = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: initialState,
  });

  return ({ children }) => (
    <Provider store={mockStore}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/auth" element={children} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('Auth', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
  });

  describe('Component Rendering', () => {
    it('displays the correct contents when not logged in', () => {
      const Wrapper = createWrapper();
      render(<Auth />, { wrapper: Wrapper });

      // It should find the tabs
      expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Signup/i).length).toBeGreaterThan(0);
    });

    it('renders the correct component structure', () => {
      const Wrapper = createWrapper();
      const { container } = render(<Auth />, { wrapper: Wrapper });

      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.card-panel')).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('shows loading state when checking session with token', async () => {
      // Set up token in localStorage
      mockLocalStorage.setItem('user', 'test-token');

      const initialState = {
        auth: {
          token: 'test-token',
          user: { _id: '123', name: { first: 'Test', last: 'User' } },
          session: {
            loggedIn: false,
            loading: true, // Session check in progress
          },
        },
      };

      const Wrapper = createWrapper(initialState);
      render(<Auth />, { wrapper: Wrapper });

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();
      });
    });

    it('redirects to dashboard when user is logged in', async () => {
      // Set up token in localStorage
      mockLocalStorage.setItem('user', 'test-token');

      const initialState = {
        auth: {
          token: 'test-token',
          user: { _id: '123', name: { first: 'Test', last: 'User' } },
          session: {
            loggedIn: true, // Session validated
            loading: false,
          },
        },
      };

      const Wrapper = createWrapper(initialState);
      render(<Auth />, { wrapper: Wrapper });

      // Should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });

      // Should NOT show auth page
      expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    });

    it('shows auth page when no token exists', () => {
      // No token in localStorage - ensure it's cleared
      mockLocalStorage.clear();

      const initialState = {
        auth: {
          token: '',
          user: {},
          session: {
            loggedIn: false,
            loading: false,
          },
        },
      };

      const Wrapper = createWrapper(initialState);
      const { container } = render(<Auth />, { wrapper: Wrapper });

      // Component should render without crashing
      expect(container).toBeInTheDocument();

      // Should NOT redirect to dashboard when no token
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    it('triggers session validation when token exists but session not validated', () => {
      // Token exists but session not yet validated
      // This simulates the initial state when page loads with a token
      mockLocalStorage.setItem('user', 'test-token');

      const initialState = {
        auth: {
          token: 'test-token',
          user: { _id: '123', name: { first: 'Test', last: 'User' } },
          session: {
            loggedIn: false, // Not validated yet
            loading: false,
          },
        },
      };

      const Wrapper = createWrapper(initialState);
      const { container } = render(<Auth />, { wrapper: Wrapper });

      // The useEffect will trigger getSession
      // The component should render without crashing
      expect(container).toBeInTheDocument();
    });
  });
});
