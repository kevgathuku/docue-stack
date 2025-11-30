/**
 * Tests for Admin ReScript component
 *
 * Requirements tested:
 * - 3.1: Admin dashboard fetches statistics from API with authentication token
 * - 3.2: Statistics display counts for users, documents, and roles
 * - 3.3: API request failure displays error message
 * - 3.4: Component automatically triggers statistics fetch on mount
 * - 3.5: Statistics display provides navigation links to manage each resource type
 * - 11.1: Unit tests for rendering
 * - 11.3: Tests for API integration success and error scenarios
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Admin from '../Admin.res.js';

describe('Admin ReScript Component', () => {
  let mockFetch;
  let mockGetItem;

  beforeEach(() => {
    // Reset mock values
    mockGetItem = null;

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (key) => mockGetItem,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      writable: true,
      configurable: true,
    });

    // Mock fetch API
    mockFetch = null;
    global.fetch = async (url, options) => {
      if (mockFetch) {
        return mockFetch(url, options);
      }
      throw new Error('Fetch not mocked');
    };
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      mockGetItem = null;
      const { container } = render(<Admin />);
      expect(container).toBeTruthy();
    });

    it('renders stats cards when data is loaded', async () => {
      // Mock token
      mockGetItem = 'test-token';

      // Mock successful API response
      const mockStats = {
        users: 42,
        documents: 128,
        roles: 5,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      render(<Admin />);

      // Wait for stats to load
      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });

      // Check that all three stat cards are rendered
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Total Documents')).toBeInTheDocument();
        expect(screen.getByText('Total Roles')).toBeInTheDocument();
      });

      // Check that the counts are displayed
      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('128')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('renders stats with correct IDs for each count', async () => {
      mockGetItem = 'test-token';

      const mockStats = {
        users: 10,
        documents: 20,
        roles: 3,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      const { container } = render(<Admin />);

      await waitFor(() => {
        const usersCount = container.querySelector('#users-count');
        expect(usersCount).toBeInTheDocument();
        expect(usersCount).toHaveTextContent('10');
      });

      await waitFor(() => {
        const docsCount = container.querySelector('#docs-count');
        expect(docsCount).toBeInTheDocument();
        expect(docsCount).toHaveTextContent('20');
      });

      await waitFor(() => {
        const rolesCount = container.querySelector('#roles-count');
        expect(rolesCount).toBeInTheDocument();
        expect(rolesCount).toHaveTextContent('3');
      });
    });
  });

  describe('Navigation Links', () => {
    it('renders navigation links for all resource types', async () => {
      mockGetItem = 'test-token';

      const mockStats = {
        users: 1,
        documents: 1,
        roles: 1,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      const { container } = render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });

      // Check for "Manage Users" link
      await waitFor(() => {
        const manageUsersLink = screen.getByText('Manage Users').closest('a');
        expect(manageUsersLink).toBeInTheDocument();
        expect(manageUsersLink).toHaveAttribute('href', '/admin/users');
      });

      // Check for "Manage Docs" link
      await waitFor(() => {
        const manageDocsLink = screen.getByText('Manage Docs').closest('a');
        expect(manageDocsLink).toBeInTheDocument();
        expect(manageDocsLink).toHaveAttribute('href', '/dashboard');
      });

      // Check for "Manage Roles" link
      await waitFor(() => {
        const manageRolesLink = screen.getByText('Manage Roles').closest('a');
        expect(manageRolesLink).toBeInTheDocument();
        expect(manageRolesLink).toHaveAttribute('href', '/admin/roles');
      });
    });

    it('renders navigation links with correct CSS classes', async () => {
      mockGetItem = 'test-token';

      const mockStats = {
        users: 1,
        documents: 1,
        roles: 1,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      render(<Admin />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const manageLinks = links.filter((link) => link.textContent.includes('Manage'));

        manageLinks.forEach((link) => {
          expect(link).toHaveClass('waves-effect');
          expect(link).toHaveClass('waves-light');
          expect(link).toHaveClass('btn');
          expect(link).toHaveClass('blue');
        });
      });
    });

    it('renders navigation links with Material Icons', async () => {
      mockGetItem = 'test-token';

      const mockStats = {
        users: 1,
        documents: 1,
        roles: 1,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      const { container } = render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });

      // Check for Material Icons
      await waitFor(() => {
        const icons = container.querySelectorAll('.material-icons.left');
        expect(icons.length).toBe(3);

        const iconTexts = Array.from(icons).map((icon) => icon.textContent);
        expect(iconTexts).toContain('face');
        expect(iconTexts).toContain('drafts');
        expect(iconTexts).toContain('settings');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      mockGetItem = 'test-token';

      // Mock failed API response
      mockFetch = async () => ({
        ok: false,
        status: 500,
      });

      render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch stats/)).toBeInTheDocument();
      });
    });

    it('displays error when no authentication token', async () => {
      mockGetItem = null;

      render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/No authentication token found/)).toBeInTheDocument();
      });
    });

    it('displays error message with red text styling', async () => {
      mockGetItem = 'test-token';

      mockFetch = async () => ({
        ok: false,
        status: 404,
      });

      const { container } = render(<Admin />);

      await waitFor(() => {
        const errorText = container.querySelector('.red-text');
        expect(errorText).toBeInTheDocument();
        expect(errorText).toHaveClass('flow-text');
      });
    });

    it('handles network errors gracefully', async () => {
      mockGetItem = 'test-token';

      // Mock network error
      mockFetch = async () => {
        throw new Error('Network error');
      };

      render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Network error occurred/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('displays loading message initially', () => {
      mockGetItem = 'test-token';

      // Don't resolve the fetch immediately
      mockFetch = () => new Promise(() => {});

      render(<Admin />);

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has proper Materialize CSS structure', async () => {
      mockGetItem = 'test-token';

      const mockStats = {
        users: 1,
        documents: 1,
        roles: 1,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      const { container } = render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });

      // Check for container
      await waitFor(() => {
        const containerDiv = container.querySelector('.container');
        expect(containerDiv).toBeInTheDocument();
      });

      // Check for card-panel
      await waitFor(() => {
        const cardPanel = container.querySelector('.card-panel');
        expect(cardPanel).toBeInTheDocument();
      });

      // Check for row
      await waitFor(() => {
        const rows = container.querySelectorAll('.row');
        expect(rows.length).toBeGreaterThan(0);
      });

      // Check for columns with proper grid classes
      await waitFor(() => {
        const columns = container.querySelectorAll('.col.s4.center-align');
        expect(columns.length).toBe(3);
      });
    });

    it('renders heading with correct classes', async () => {
      mockGetItem = 'test-token';

      const mockStats = {
        users: 1,
        documents: 1,
        roles: 1,
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockStats,
      });

      render(<Admin />);

      await waitFor(() => {
        const heading = screen.getByText('Admin Panel');
        expect(heading).toHaveClass('header');
        expect(heading).toHaveClass('center-align');
        expect(heading.tagName).toBe('H2');
      });
    });
  });
});
