'use strict';

import { jest } from '@jest/globals';
import { render } from '@testing-library/react';

// Mock Elm module BEFORE any imports
jest.mock('../../Profile.elm', () => ({
  Elm: {
    Profile: {
      init: jest.fn(() => ({
        ports: {
          materializeToast: {
            subscribe: jest.fn(),
          },
          updateCachedUserInfo: {
            subscribe: jest.fn(),
          },
        },
      })),
    },
  },
}));

describe('Profile', function() {
  let Profile;
  const mockUser = {
    _id: 1,
    name: {
      first: 'Khaled',
      last: 'Another One',
    },
    role: {
      title: 'viewer',
    },
    email: 'khaled@anotherone.com',
  };

  beforeAll(function() {
    // Mock localStorage BEFORE importing Profile component
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'userInfo') return JSON.stringify(mockUser);
      if (key === 'user') return 'faketoken';
      return null;
    });

    // Now import the Profile component after mocks are set up
    Profile = require('../Profile.jsx').default;
  });

  beforeEach(function() {
    jest.clearAllMocks();
  });

  describe('Component Rendering', function() {
    it('renders the profile component', function() {
      const { container } = render(<Profile />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('uses localStorage to get user info', function() {
      render(<Profile />);
      // localStorage.getItem was called during module load
      // Just verify the component renders successfully with the mocked data
      expect(Storage.prototype.getItem).toHaveBeenCalled();
    });

    it('initializes Elm component with user data', function() {
      const ElmProfile = require('../../Profile.elm');
      render(<Profile />);
      
      // Verify Elm was initialized
      expect(ElmProfile.Elm.Profile.init).toHaveBeenCalled();
    });
  });
});
