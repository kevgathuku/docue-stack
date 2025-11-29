'use strict';

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Profile from '../Profile.res.js';

describe('Profile', function() {
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

  beforeEach(function() {
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
  });

  describe('Component Rendering', function() {
    it('renders the profile component', function() {
      const { container } = render(<Profile />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('uses localStorage to get user info', function() {
      render(<Profile />);
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });

    it('displays user profile information', function() {
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

    it('shows loading state when no user info', function() {
      localStorageMock.getItem = jest.fn(() => null);
      
      render(<Profile />);
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });
});
