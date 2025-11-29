'use strict';

import { render } from '@testing-library/react';
import Profile from '../Profile.jsx';

// Mock Elm module
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
  beforeAll(function() {
    let user = {
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
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'userInfo') return JSON.stringify(user);
      if (key === 'user') return 'faketoken';
      return null;
    });
  });

  describe('Component Rendering', function() {
    it('renders the profile component', function() {
      const { container } = render(<Profile />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('uses localStorage to get user info', function() {
      render(<Profile />);
      expect(localStorage.getItem).toHaveBeenCalledWith('userInfo');
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
    });
  });
});
