import React from 'react';
import { render } from '@testing-library/react';
import RolesAdmin from '../RolesAdmin.jsx';

describe('RolesAdmin', function() {
  describe('Component Rendering', function() {
    it('renders without crashing', function() {
      const { container } = render(<RolesAdmin />);
      // Component renders (Elm integration is mocked)
      expect(container).toBeTruthy();
    });
  });
});
