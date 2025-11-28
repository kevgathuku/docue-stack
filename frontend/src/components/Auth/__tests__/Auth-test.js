'use strict';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Auth from '../Auth.jsx';

// Mock reducer for testing
const mockReducer = (state = {}) => state;
const mockStore = createStore(mockReducer);

// Wrapper component for Router and Redux
const Wrapper = ({ children }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('Auth', function() {
  describe('Component Rendering', function() {
    it('displays the correct contents', function() {
      render(<Auth />, { wrapper: Wrapper });
      
      // It should find the correct content
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Signup/i)).toBeInTheDocument();
    });

    it('renders the correct component structure', function() {
      const { container } = render(<Auth />, { wrapper: Wrapper });
      
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.card-panel')).toBeInTheDocument();
    });
  });
});
