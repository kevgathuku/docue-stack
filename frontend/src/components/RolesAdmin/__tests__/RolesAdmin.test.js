import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RolesAdmin from '../RolesAdmin.res.js';

describe('RolesAdmin', function() {
  let mockFetch;
  let mockGetItem;
  let tooltipCalls;

  beforeEach(() => {
    // Reset mock values
    mockGetItem = null;
    tooltipCalls = [];
    
    // Mock localStorage - needs to be set on global.localStorage
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
    
    // Mock jQuery tooltip initialization
    global.$ = (selector) => {
      tooltipCalls.push(selector);
      return {
        tooltip: () => {},
      };
    };

    // Mock fetch API
    mockFetch = null;
    global.fetch = async (url, options) => {
      if (mockFetch) {
        return mockFetch(url, options);
      }
      throw new Error('Fetch not mocked');
    };
  });

  describe('Component Rendering', function() {
    it('renders without crashing', function() {
      mockGetItem = null;
      const { container } = render(<RolesAdmin />);
      expect(container).toBeTruthy();
    });

    it('renders table structure when roles are loaded', async function() {
      // Mock token
      mockGetItem = 'test-token';

      // Mock successful API response
      const mockRoles = [
        { _id: '1', title: 'Admin', accessLevel: 2 },
        { _id: '2', title: 'Staff', accessLevel: 1 },
      ];

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockRoles,
      });

      render(<RolesAdmin />);

      // Wait for roles to load
      await waitFor(() => {
        expect(screen.getByText('Manage Roles')).toBeInTheDocument();
      });

      // Check table headers
      await waitFor(() => {
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Access Level')).toBeInTheDocument();
      });

      // Check role data
      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Staff')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('renders floating action button', async function() {
      mockGetItem = 'test-token';

      const mockRoles = [];
      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockRoles,
      });

      const { container } = render(<RolesAdmin />);

      await waitFor(() => {
        const fab = container.querySelector('.fixed-action-btn');
        expect(fab).toBeInTheDocument();
      });

      await waitFor(() => {
        const link = container.querySelector('a[href="/admin/roles/create"]');
        expect(link).toBeInTheDocument();
      });
    });

    it('initializes Materialize tooltips', async function() {
      mockGetItem = 'test-token';

      const mockRoles = [];
      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockRoles,
      });

      render(<RolesAdmin />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Manage Roles')).toBeInTheDocument();
      });

      // Verify jQuery tooltip was called
      await waitFor(() => {
        expect(tooltipCalls).toContain('.tooltipped');
      });
    });

    it('displays error message on API failure', async function() {
      mockGetItem = 'test-token';

      // Mock failed API response
      mockFetch = async () => ({
        ok: false,
        status: 500,
      });

      render(<RolesAdmin />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch roles/)).toBeInTheDocument();
      });
    });

    it('displays error when no authentication token', async function() {
      mockGetItem = null;

      render(<RolesAdmin />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/No authentication token found/)).toBeInTheDocument();
      });
    });
  });
});
