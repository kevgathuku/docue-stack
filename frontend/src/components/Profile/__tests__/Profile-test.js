/**
 * Tests for Profile ReScript component
 *
 * Requirements tested:
 * - 2.1: Profile view displays user data
 * - 2.2: Edit button toggles to edit form
 * - 2.3: Profile updates validate inputs in real-time
 * - 2.4: Password validation (match, length > 6)
 * - 2.5: Profile update API call with authentication
 * - 2.6: Successful update refreshes localStorage
 * - 2.7: Update failure displays error toast
 * - 2.8: Cancel returns to profile view
 * - 11.1: Unit tests for rendering and interactions
 * - 11.2: Form validation tests
 * - 11.3: API integration tests
 */

import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from '../Profile.res.js';

describe('Profile Component (ReScript)', () => {
  const mockUser = {
    _id: '123',
    username: 'khaled',
    name: {
      first: 'Khaled',
      last: 'Another One',
    },
    role: {
      _id: '456',
      title: 'viewer',
      accessLevel: 1,
    },
    email: 'khaled@anotherone.com',
  };

  let localStorageMock;
  let materializeToastMock;
  let fetchMock;

  beforeEach(() => {
    // Create a proper mock for localStorage
    localStorageMock = {
      getItem: jest.fn((key) => {
        if (key === 'userInfo') return JSON.stringify(mockUser);
        if (key === 'user') return 'faketoken';
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    // Replace global localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Mock Materialize toast - matches the signature from Materialize.res
    // toast: (message: string, duration: int, className: string) => unit
    materializeToastMock = jest.fn();
    global.window.Materialize = {
      toast: materializeToastMock,
    };

    // Mock fetch for API calls
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile View Rendering', () => {
    it('renders the profile component', () => {
      const { container } = render(<Profile />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('uses localStorage to get user info', () => {
      render(<Profile />);
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });

    it('displays user profile information', () => {
      render(<Profile />);

      // Check that the profile view is rendered
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      // Check that user name is displayed
      expect(screen.getByText('Khaled Another One')).toBeInTheDocument();

      // Check that email is displayed
      expect(screen.getByText(/Email: khaled@anotherone.com/)).toBeInTheDocument();

      // Check that role is displayed
      expect(screen.getByText(/Role: viewer/)).toBeInTheDocument();
    });

    it('shows loading state when no user info', () => {
      localStorageMock.getItem = jest.fn(() => null);

      render(<Profile />);

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('displays edit button in profile view', () => {
      const { container } = render(<Profile />);

      const editButton = container.querySelector('.btn-floating');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveClass('btn-floating');
    });
  });

  describe('View/Edit Toggle', () => {
    it('toggles to edit form when edit button is clicked', () => {
      const { container } = render(<Profile />);

      // Initially in profile view
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();

      // Click edit button (find by class since it's an <a> without href)
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Now in edit view
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });

    it('returns to profile view when cancel button is clicked', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Back to profile view
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });
  });

  describe('Form Input Updates', () => {
    it('updates email state when typing', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Find and update email input
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      expect(emailInput.value).toBe('newemail@example.com');
    });

    it('updates first name state when typing', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Find and update first name input
      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: 'NewFirst' } });

      expect(firstNameInput.value).toBe('NewFirst');
    });

    it('updates last name state when typing', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Find and update last name input
      const lastNameInput = screen.getByLabelText(/last name/i);
      fireEvent.change(lastNameInput, { target: { value: 'NewLast' } });

      expect(lastNameInput.value).toBe('NewLast');
    });

    it('updates password state when typing', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Find and update password input
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      expect(passwordInput.value).toBe('newpassword123');
    });

    it('updates password confirmation state when typing', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Find and update password confirmation input
      const confirmInput = screen.getByLabelText(/confirm password/i);
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });

      expect(confirmInput.value).toBe('newpassword123');
    });
  });

  describe('Password Validation', () => {
    it('shows error toast when passwords do not match', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Enter mismatched passwords
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different123' } });

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Check that error toast was called
      expect(materializeToastMock).toHaveBeenCalledWith(
        "Passwords don't match",
        2000,
        'error-toast'
      );
    });

    it('shows error toast when password is too short', () => {
      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Enter short password
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.change(confirmInput, { target: { value: 'short' } });

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Check that error toast was called
      expect(materializeToastMock).toHaveBeenCalledWith(
        'Passwords should be > 6 characters',
        2000,
        'error-toast'
      );
    });
  });

  describe('Profile Update Success', () => {
    it('shows success toast when update succeeds', async () => {
      // Mock successful API response
      const updatedUser = {
        _id: '123',
        email: 'updated@example.com',
        name: {
          first: 'Updated',
          last: 'User',
        },
        role: {
          title: 'viewer',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedUser,
      });

      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Update fields (without password)
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Wait for async operations
      await waitFor(() => {
        expect(materializeToastMock).toHaveBeenCalledWith(
          'Profile Info Updated!',
          2000,
          'success-toast'
        );
      });

      // Check that localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userInfo', expect.any(String));
    });
  });

  describe('Profile Update Error', () => {
    it('shows error toast when API call fails', async () => {
      // Mock failed API response
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { container } = render(<Profile />);

      // Toggle to edit view
      const editButton = container.querySelector('.btn-floating');
      fireEvent.click(editButton);

      // Update fields
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Wait for async operations
      await waitFor(() => {
        expect(materializeToastMock).toHaveBeenCalledWith(
          expect.stringContaining('Update failed'),
          2000,
          'error-toast'
        );
      });
    });
  });
});
