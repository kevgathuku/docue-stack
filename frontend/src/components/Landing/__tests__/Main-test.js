import { jest } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../../features/auth/authSlice';
import { DefaultLayout } from '../Main.jsx';

describe('DefaultLayout component', () => {
  let mockStore;

  beforeEach(() => {
    // Create a mock store with auth slice
    mockStore = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Mock jQuery functions for NavBar
    window.$ = jest.fn((selector) => ({
      dropdown: jest.fn(),
      sideNav: jest.fn(),
    }));

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  const TestComponent = () => <div data-testid="test-component">Test Content</div>;

  const renderWithProviders = (initialRoute = '/dashboard') => {
    return render(
      <Provider store={mockStore}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <DefaultLayout component={TestComponent} />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders the component passed as prop', () => {
    renderWithProviders('/dashboard');

    // Should render the test component
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the NavBar component on non-home pages', () => {
    const { container } = renderWithProviders('/dashboard');

    // NavBar should be rendered on non-home pages
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();

    // Component should also be rendered
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('does not render NavBar on home page', () => {
    const { container } = renderWithProviders('/');

    // NavBar should NOT be rendered on home page
    const nav = container.querySelector('nav');
    expect(nav).not.toBeInTheDocument();

    // But component should still be rendered
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('wraps content with Provider', () => {
    renderWithProviders('/dashboard');

    // Component should render successfully (Provider is working)
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});
