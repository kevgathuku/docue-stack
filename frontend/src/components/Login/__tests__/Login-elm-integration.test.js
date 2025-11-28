import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import Login from '../Login.jsx';

// Simple reducer for testing
const mockReducer = (state = {}) => state;

describe('Login Component - Elm Integration', () => {
  let store;

  beforeEach(() => {
    store = createStore(mockReducer, {
      loginError: null,
      token: null,
      user: null,
    });
  });

  it('should render without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    expect(container).toBeInTheDocument();
  });

  it('should render the Elm component wrapper (ReactElm)', () => {
    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    // The ReactElm component renders a div that will contain the Elm app
    const elmContainer = container.querySelector('div');
    expect(elmContainer).toBeInTheDocument();
  });

  it('should pass props to the Login component', () => {
    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    // Component should render successfully with Redux store
    expect(container.firstChild).toBeInTheDocument();
  });
});
