/**
 * **Feature: flux-to-redux-migration, Property 7: Component re-render equivalence**
 * **Validates: Requirements 5.5**
 * 
 * Property: For any state change in Redux, components using useSelector should 
 * re-render in the same scenarios as components using Flux store listeners
 */

import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import fc from 'fast-check';
import authReducer from '../../features/auth/authSlice';

describe('Property 7: Component re-render equivalence', () => {
  // Helper to render with Redux provider
  const renderWithRedux = (component, store) => {
    return render(
      <Provider store={store}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  it('should re-render when loginError changes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage) => {
          const store = configureStore({
            reducer: {
              auth: authReducer,
            },
          });

          let renderCount = 0;
          const TestComponent = () => {
            const { useAppSelector } = require('../../store/hooks');
            const loginError = useAppSelector((state) => state.auth.loginError);
            renderCount++;
            return <div>{loginError}</div>;
          };

          renderWithRedux(<TestComponent />, store);
          
          const initialRenderCount = renderCount;

          // Dispatch a direct action to change loginError
          act(() => {
            store.dispatch({
              type: 'auth/login/rejected',
              payload: errorMessage,
            });
          });

          // Component should have re-rendered when loginError changed
          return renderCount > initialRenderCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should re-render when session.loading changes', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (loadingState) => {
          const store = configureStore({
            reducer: {
              auth: authReducer,
            },
          });

          let renderCount = 0;
          const TestComponent = () => {
            const { useAppSelector } = require('../../store/hooks');
            const session = useAppSelector((state) => state.auth.session);
            renderCount++;
            return <div>{session.loading ? 'Loading' : 'Not Loading'}</div>;
          };

          renderWithRedux(<TestComponent />, store);
          
          const initialRenderCount = renderCount;

          // Dispatch getSession pending action
          act(() => {
            store.dispatch({
              type: 'auth/getSession/pending',
            });
          });

          // Component should have re-rendered when session.loading changed
          return renderCount > initialRenderCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should re-render when token changes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }),
        (token) => {
          const store = configureStore({
            reducer: {
              auth: authReducer,
            },
          });

          let renderCount = 0;
          const TestComponent = () => {
            const { useAppSelector } = require('../../store/hooks');
            const authToken = useAppSelector((state) => state.auth.token);
            renderCount++;
            return <div>{authToken || 'No token'}</div>;
          };

          renderWithRedux(<TestComponent />, store);
          
          const initialRenderCount = renderCount;

          // Dispatch login fulfilled action
          act(() => {
            store.dispatch({
              type: 'auth/login/fulfilled',
              payload: { token, user: { email: 'test@example.com' } },
            });
          });

          // Component should have re-rendered when token changed
          return renderCount > initialRenderCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should re-render when user changes', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          _id: fc.string({ minLength: 10, maxLength: 20 }),
        }),
        (user) => {
          const store = configureStore({
            reducer: {
              auth: authReducer,
            },
          });

          let renderCount = 0;
          const TestComponent = () => {
            const { useAppSelector } = require('../../store/hooks');
            const currentUser = useAppSelector((state) => state.auth.user);
            renderCount++;
            return <div>{currentUser.email || 'No user'}</div>;
          };

          renderWithRedux(<TestComponent />, store);
          
          const initialRenderCount = renderCount;

          // Dispatch signup fulfilled action
          act(() => {
            store.dispatch({
              type: 'auth/signup/fulfilled',
              payload: { token: 'test-token', user },
            });
          });

          // Component should have re-rendered when user changed
          return renderCount > initialRenderCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT re-render when unrelated state changes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage) => {
          const store = configureStore({
            reducer: {
              auth: authReducer,
            },
          });

          let renderCount = 0;
          const TestComponent = () => {
            const { useAppSelector } = require('../../store/hooks');
            // Only selecting token, not loginError
            const token = useAppSelector((state) => state.auth.token);
            renderCount++;
            return <div>{token}</div>;
          };

          renderWithRedux(<TestComponent />, store);
          
          const initialRenderCount = renderCount;

          // Dispatch action that changes loginError (not token)
          act(() => {
            store.dispatch({
              type: 'auth/login/rejected',
              payload: errorMessage,
            });
          });

          // Component should NOT have re-rendered since token didn't change
          return renderCount === initialRenderCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});
