import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RolesAdmin from '../RolesAdmin.res.js';

describe('RolesAdmin', function() {
  let tooltipCalls;

  beforeEach(() => {
    // Reset mock values
    tooltipCalls = [];
    
    // Mock jQuery tooltip initialization
    global.$ = (selector) => {
      tooltipCalls.push(selector);
      return {
        tooltip: () => {},
      };
    };
  });

  describe('Component Rendering', function() {
    it('renders without crashing', function() {
      const { container } = render(<RolesAdmin roles={null} loading={false} error={null} />);
      expect(container).toBeTruthy();
    });

    it('renders table structure when roles are loaded', async function() {
      const mockRoles = [
        { id: '1', title: 'Admin', accessLevel: 2 },
        { id: '2', title: 'Staff', accessLevel: 1 },
      ];

      render(<RolesAdmin roles={mockRoles} loading={false} error={null} />);

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
      const mockRoles = [
        { id: '1', title: 'Admin', accessLevel: 2 },
      ];

      const { container } = render(<RolesAdmin roles={mockRoles} loading={false} error={null} />);

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
      const mockRoles = [];

      render(<RolesAdmin roles={mockRoles} loading={false} error={null} />);

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
      render(<RolesAdmin roles={null} loading={false} error="Failed to fetch roles: HTTP 500" />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch roles/)).toBeInTheDocument();
      });
    });

    it('displays no roles message when roles array is empty', async function() {
      render(<RolesAdmin roles={null} loading={false} error={null} />);

      await waitFor(() => {
        expect(screen.getByText('Manage Roles')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/No roles found/)).toBeInTheDocument();
      });
    });
  });
});
