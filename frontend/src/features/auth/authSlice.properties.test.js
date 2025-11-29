import * as fc from 'fast-check';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import reducer from '../../stores/reducer';

/**
 * Property-Based Tests for Auth Slice
 * 
 * These tests verify that the Redux Toolkit auth slice maintains
 * behavioral equivalence with the original Flux reducer.
 */

describe('Auth Slice Property-Based Tests', () => {
  /**
   * **Feature: flux-to-redux-migration, Property 1: State management equivalence (auth)**
   * **Feature: flux-to-redux-migration, Property 4: Authentication functionality preservation**
   * **Validates: Requirements 2.3, 5.1, 5.4**
   * 
   * For any action dispatched to the Redux auth slice, the resulting state
   * should be equivalent to the state that would have been produced by the
   * corresponding Flux reducer.
   */
  describe('Property 1 & 4: State management equivalence and authentication preservation', () => {
    // Arbitraries for generating test data
    const userArb = fc.record({
      _id: fc.string({ minLength: 1 }),
      username: fc.string({ minLength: 1 }),
      email: fc.emailAddress(),
    });

    const usersArrayArb = fc.array(userArb, { minLength: 0, maxLength: 5 });

    const tokenArb = fc.string({ minLength: 10, maxLength: 50 });

    const errorArb = fc.oneof(
      fc.string({ minLength: 1 }),
      fc.constant(null)
    );

    it('should produce equivalent state for fetchUsers actions', () => {
      fc.assert(
        fc.property(usersArrayArb, (users) => {
          // Test fulfilled action
          const fulfilledAction = {
            type: 'auth/fetchUsers/fulfilled',
            payload: users,
          };

          const reduxState = authReducer(undefined, fulfilledAction);
          const fluxState = reducer(undefined, {
            type: 'FETCH_USERS_SUCCESS',
            payload: { users },
          });

          expect(reduxState.users).toEqual(fluxState.users);
          expect(reduxState.usersError).toEqual(fluxState.usersError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for fetchUsers error actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          const rejectedAction = {
            type: 'auth/fetchUsers/rejected',
            payload: error,
          };

          const reduxState = authReducer(undefined, rejectedAction);
          const fluxState = reducer(undefined, {
            type: 'FETCH_USERS_ERROR',
            payload: { error },
          });

          expect(reduxState.usersError).toEqual(fluxState.usersError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for signup actions', () => {
      fc.assert(
        fc.property(tokenArb, userArb, (token, user) => {
          const fulfilledAction = {
            type: 'auth/signup/fulfilled',
            payload: { token, user },
          };

          const reduxState = authReducer(undefined, fulfilledAction);
          const fluxState = reducer(undefined, {
            type: 'SIGNUP_SUCCESS',
            payload: { signupResult: { token, user } },
          });

          expect(reduxState.token).toEqual(fluxState.token);
          expect(reduxState.user).toEqual(fluxState.user);
          expect(reduxState.signupError).toEqual(fluxState.signupError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for signup error actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          const rejectedAction = {
            type: 'auth/signup/rejected',
            payload: error,
          };

          const reduxState = authReducer(undefined, rejectedAction);
          const fluxState = reducer(undefined, {
            type: 'SIGNUP_ERROR',
            payload: { error },
          });

          expect(reduxState.signupError).toEqual(fluxState.signupError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for login actions', () => {
      fc.assert(
        fc.property(tokenArb, userArb, (token, user) => {
          const fulfilledAction = {
            type: 'auth/login/fulfilled',
            payload: { token, user },
          };

          const reduxState = authReducer(undefined, fulfilledAction);
          const fluxState = reducer(undefined, {
            type: 'LOGIN_SUCCESS',
            payload: { loginResult: { token, user } },
          });

          expect(reduxState.token).toEqual(fluxState.token);
          expect(reduxState.user).toEqual(fluxState.user);
          expect(reduxState.loginError).toEqual(fluxState.loginError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for login error actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          const rejectedAction = {
            type: 'auth/login/rejected',
            payload: error,
          };

          const reduxState = authReducer(undefined, rejectedAction);
          const fluxState = reducer(undefined, {
            type: 'LOGIN_ERROR',
            payload: { error },
          });

          expect(reduxState.loginError).toEqual(fluxState.loginError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for logout actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (message) => {
          // Start with logged in state
          const initialState = {
            ...authReducer(undefined, {}),
            token: 'some-token',
            user: { _id: '1', username: 'test' },
          };

          const fulfilledAction = {
            type: 'auth/logout/fulfilled',
            payload: { message },
          };

          const reduxState = authReducer(initialState, fulfilledAction);
          const fluxState = reducer(
            {
              ...reducer(undefined, {}),
              token: 'some-token',
              user: { _id: '1', username: 'test' },
            },
            {
              type: 'LOGOUT_SUCCESS',
              payload: { logoutResult: { message } },
            }
          );

          expect(reduxState.token).toEqual(fluxState.token);
          expect(reduxState.user).toEqual(fluxState.user);
          expect(reduxState.logoutResult).toEqual(fluxState.logoutResult);
          expect(reduxState.logoutError).toEqual(fluxState.logoutError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for logout error actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          const rejectedAction = {
            type: 'auth/logout/rejected',
            payload: error,
          };

          const reduxState = authReducer(undefined, rejectedAction);
          const fluxState = reducer(undefined, {
            type: 'LOGOUT_ERROR',
            payload: { error },
          });

          expect(reduxState.logoutError).toEqual(fluxState.logoutError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for getSession pending actions', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const pendingAction = {
            type: 'auth/getSession/pending',
          };

          const reduxState = authReducer(undefined, pendingAction);
          const fluxState = reducer(undefined, {
            type: 'GET_SESSION_START',
          });

          expect(reduxState.session).toEqual(fluxState.session);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for getSession success when logged in', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const fulfilledAction = {
            type: 'auth/getSession/fulfilled',
            payload: { loggedIn: true, user },
          };

          const reduxState = authReducer(undefined, fulfilledAction);
          const fluxState = reducer(undefined, {
            type: 'GET_SESSION_SUCCESS',
            payload: { session: { loggedIn: true, user } },
          });

          expect(reduxState.session).toEqual(fluxState.session);
          expect(reduxState.user).toEqual(fluxState.user);
          expect(reduxState.sessionError).toEqual(fluxState.sessionError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for getSession success when not logged in', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const fulfilledAction = {
            type: 'auth/getSession/fulfilled',
            payload: { loggedIn: false },
          };

          const reduxState = authReducer(undefined, fulfilledAction);
          const fluxState = reducer(undefined, {
            type: 'GET_SESSION_SUCCESS',
            payload: { session: { loggedIn: false } },
          });

          expect(reduxState.session).toEqual(fluxState.session);
          expect(reduxState.token).toEqual(fluxState.token);
          expect(reduxState.user).toEqual(fluxState.user);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for getSession error actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          const rejectedAction = {
            type: 'auth/getSession/rejected',
            payload: error,
          };

          const reduxState = authReducer(undefined, rejectedAction);
          const fluxState = reducer(undefined, {
            type: 'GET_SESSION_ERROR',
            payload: { error },
          });

          expect(reduxState.session).toEqual(fluxState.session);
          expect(reduxState.sessionError).toEqual(fluxState.sessionError);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for updateProfile actions', () => {
      fc.assert(
        fc.property(userArb, usersArrayArb, (updatedUser, users) => {
          // Ensure the updated user is in the users array
          const usersWithTarget = [updatedUser, ...users];

          const initialState = {
            ...authReducer(undefined, {}),
            users: usersWithTarget,
          };

          const fulfilledAction = {
            type: 'auth/updateProfile/fulfilled',
            payload: updatedUser,
          };

          const reduxState = authReducer(initialState, fulfilledAction);
          const fluxState = reducer(
            {
              ...reducer(undefined, {}),
              users: usersWithTarget,
            },
            {
              type: 'PROFILE_UPDATE_SUCCESS',
              payload: { user: updatedUser },
            }
          );

          expect(reduxState.profileUpdateError).toEqual(
            fluxState.profileUpdateError
          );
          expect(reduxState.users).toEqual(fluxState.users);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce equivalent state for updateProfile error actions', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          const rejectedAction = {
            type: 'auth/updateProfile/rejected',
            payload: error,
          };

          const reduxState = authReducer(undefined, rejectedAction);
          const fluxState = reducer(undefined, {
            type: 'PROFILE_UPDATE_ERROR',
            payload: { error },
          });

          expect(reduxState.profileUpdateError).toEqual(
            fluxState.profileUpdateError
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain state equivalence across action sequences', () => {
      fc.assert(
        fc.property(
          tokenArb,
          userArb,
          fc.string({ minLength: 1 }),
          (token, user, message) => {
            // Simulate a login -> logout sequence
            const loginAction = {
              type: 'auth/login/fulfilled',
              payload: { token, user },
            };

            const logoutAction = {
              type: 'auth/logout/fulfilled',
              payload: { message },
            };

            // Redux sequence
            let reduxState = authReducer(undefined, loginAction);
            reduxState = authReducer(reduxState, logoutAction);

            // Flux sequence
            let fluxState = reducer(undefined, {
              type: 'LOGIN_SUCCESS',
              payload: { loginResult: { token, user } },
            });
            fluxState = reducer(fluxState, {
              type: 'LOGOUT_SUCCESS',
              payload: { logoutResult: { message } },
            });

            expect(reduxState.token).toEqual(fluxState.token);
            expect(reduxState.user).toEqual(fluxState.user);
            expect(reduxState.logoutResult).toEqual(fluxState.logoutResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: flux-to-redux-migration, Property 2: Async thunk state transitions**
   * **Validates: Requirements 3.4**
   * 
   * For any async thunk execution, the state should transition through pending status,
   * then to either fulfilled or rejected status with appropriate data or error.
   */
  describe('Property 2: Async thunk state transitions', () => {
    const userArb = fc.record({
      _id: fc.string({ minLength: 1 }),
      username: fc.string({ minLength: 1 }),
      email: fc.emailAddress(),
    });

    const tokenArb = fc.string({ minLength: 10, maxLength: 50 });

    it('should transition through pending -> fulfilled for successful operations', () => {
      fc.assert(
        fc.property(tokenArb, userArb, (token, user) => {
          // Test login flow
          let state = authReducer(undefined, {});

          // Pending state
          state = authReducer(state, {
            type: 'auth/login/pending',
          });
          // State should be in pending (no specific pending state for login, but action should not break)

          // Fulfilled state
          state = authReducer(state, {
            type: 'auth/login/fulfilled',
            payload: { token, user },
          });

          // After fulfilled, should have token and user
          expect(state.token).toBe(token);
          expect(state.user).toEqual(user);
          expect(state.loginError).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('should transition through pending -> rejected for failed operations', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          // Test login flow
          let state = authReducer(undefined, {});

          // Pending state
          state = authReducer(state, {
            type: 'auth/login/pending',
          });

          // Rejected state
          state = authReducer(state, {
            type: 'auth/login/rejected',
            payload: error,
          });

          // After rejected, should have error
          expect(state.loginError).toBe(error);
          expect(state.token).toBe('');
          expect(state.user).toEqual({});
        }),
        { numRuns: 100 }
      );
    });

    it('should handle getSession pending -> fulfilled transition with loading state', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          let state = authReducer(undefined, {});

          // Pending state - should set loading to true
          state = authReducer(state, {
            type: 'auth/getSession/pending',
          });

          expect(state.session.loading).toBe(true);
          expect(state.session.loggedIn).toBe(false);

          // Fulfilled state - should set loading to false and update loggedIn
          state = authReducer(state, {
            type: 'auth/getSession/fulfilled',
            payload: { loggedIn: true, user },
          });

          expect(state.session.loading).toBe(false);
          expect(state.session.loggedIn).toBe(true);
          expect(state.user).toEqual(user);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle getSession pending -> rejected transition with loading state', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          let state = authReducer(undefined, {});

          // Pending state - should set loading to true
          state = authReducer(state, {
            type: 'auth/getSession/pending',
          });

          expect(state.session.loading).toBe(true);

          // Rejected state - should set loading to false and set error
          state = authReducer(state, {
            type: 'auth/getSession/rejected',
            payload: error,
          });

          expect(state.session.loading).toBe(false);
          expect(state.session.loggedIn).toBe(false);
          expect(state.sessionError).toBe(error);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle fetchUsers pending -> fulfilled transition', () => {
      fc.assert(
        fc.property(
          fc.array(userArb, { minLength: 0, maxLength: 10 }),
          (users) => {
            let state = authReducer(undefined, {});

            // Pending state (no specific pending handler, but should not break)
            state = authReducer(state, {
              type: 'auth/fetchUsers/pending',
            });

            // Fulfilled state
            state = authReducer(state, {
              type: 'auth/fetchUsers/fulfilled',
              payload: users,
            });

            expect(state.users).toEqual(users);
            expect(state.usersError).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle fetchUsers pending -> rejected transition', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (error) => {
          let state = authReducer(undefined, {});

          // Pending state
          state = authReducer(state, {
            type: 'auth/fetchUsers/pending',
          });

          // Rejected state
          state = authReducer(state, {
            type: 'auth/fetchUsers/rejected',
            payload: error,
          });

          expect(state.usersError).toBe(error);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle signup pending -> fulfilled transition', () => {
      fc.assert(
        fc.property(tokenArb, userArb, (token, user) => {
          let state = authReducer(undefined, {});

          // Pending state
          state = authReducer(state, {
            type: 'auth/signup/pending',
          });

          // Fulfilled state
          state = authReducer(state, {
            type: 'auth/signup/fulfilled',
            payload: { token, user },
          });

          expect(state.token).toBe(token);
          expect(state.user).toEqual(user);
          expect(state.signupError).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle logout pending -> fulfilled transition', () => {
      fc.assert(
        fc.property(
          tokenArb,
          userArb,
          fc.string({ minLength: 1 }),
          (token, user, message) => {
            // Start with logged in state
            let state = authReducer(undefined, {});
            state = authReducer(state, {
              type: 'auth/login/fulfilled',
              payload: { token, user },
            });

            // Pending state
            state = authReducer(state, {
              type: 'auth/logout/pending',
            });

            // Fulfilled state
            state = authReducer(state, {
              type: 'auth/logout/fulfilled',
              payload: { message },
            });

            expect(state.token).toBe('');
            expect(state.user).toEqual({});
            expect(state.logoutResult).toBe(message);
            expect(state.logoutError).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle updateProfile pending -> fulfilled transition', () => {
      fc.assert(
        fc.property(userArb, (updatedUser) => {
          let state = authReducer(undefined, {});

          // Pending state
          state = authReducer(state, {
            type: 'auth/updateProfile/pending',
          });

          // Fulfilled state
          state = authReducer(state, {
            type: 'auth/updateProfile/fulfilled',
            payload: updatedUser,
          });

          expect(state.profileUpdateError).toBe('');
          expect(state.profileUpdateResult).toEqual(updatedUser);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple async operations in sequence', () => {
      fc.assert(
        fc.property(
          tokenArb,
          userArb,
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (token, user, loginError, logoutMessage) => {
            let state = authReducer(undefined, {});

            // Failed login
            state = authReducer(state, {
              type: 'auth/login/pending',
            });
            state = authReducer(state, {
              type: 'auth/login/rejected',
              payload: loginError,
            });
            expect(state.loginError).toBe(loginError);

            // Successful login
            state = authReducer(state, {
              type: 'auth/login/pending',
            });
            state = authReducer(state, {
              type: 'auth/login/fulfilled',
              payload: { token, user },
            });
            expect(state.token).toBe(token);
            expect(state.loginError).toBe(''); // Error should be cleared

            // Successful logout
            state = authReducer(state, {
              type: 'auth/logout/pending',
            });
            state = authReducer(state, {
              type: 'auth/logout/fulfilled',
              payload: { message: logoutMessage },
            });
            expect(state.token).toBe('');
            expect(state.logoutResult).toBe(logoutMessage);
          }
        ),
        { numRuns: 100 }
      );
    });
  });



  /**
   * **Feature: flux-to-redux-migration, Property 3: Error handling preservation**
   * **Validates: Requirements 3.5**
   * 
   * For any API call that fails, the error should be captured in the Redux state
   * in the same format as the Flux implementation.
   */
  describe('Property 3: Error handling preservation', () => {
    const errorArb = fc.oneof(
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.record({
        message: fc.string({ minLength: 1 }),
        code: fc.integer({ min: 400, max: 599 }),
      })
    );

    it('should capture fetchUsers errors in the same format as Flux', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          const reduxAction = {
            type: 'auth/fetchUsers/rejected',
            payload: errorString,
          };

          const fluxAction = {
            type: 'FETCH_USERS_ERROR',
            payload: { error: errorString },
          };

          const reduxState = authReducer(undefined, reduxAction);
          const fluxState = reducer(undefined, fluxAction);

          expect(reduxState.usersError).toEqual(fluxState.usersError);
        }),
        { numRuns: 100 }
      );
    });

    it('should capture signup errors in the same format as Flux', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          const reduxAction = {
            type: 'auth/signup/rejected',
            payload: errorString,
          };

          const fluxAction = {
            type: 'SIGNUP_ERROR',
            payload: { error: errorString },
          };

          const reduxState = authReducer(undefined, reduxAction);
          const fluxState = reducer(undefined, fluxAction);

          expect(reduxState.signupError).toEqual(fluxState.signupError);
        }),
        { numRuns: 100 }
      );
    });

    it('should capture login errors in the same format as Flux', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          const reduxAction = {
            type: 'auth/login/rejected',
            payload: errorString,
          };

          const fluxAction = {
            type: 'LOGIN_ERROR',
            payload: { error: errorString },
          };

          const reduxState = authReducer(undefined, reduxAction);
          const fluxState = reducer(undefined, fluxAction);

          expect(reduxState.loginError).toEqual(fluxState.loginError);
        }),
        { numRuns: 100 }
      );
    });

    it('should capture logout errors in the same format as Flux', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          const reduxAction = {
            type: 'auth/logout/rejected',
            payload: errorString,
          };

          const fluxAction = {
            type: 'LOGOUT_ERROR',
            payload: { error: errorString },
          };

          const reduxState = authReducer(undefined, reduxAction);
          const fluxState = reducer(undefined, fluxAction);

          expect(reduxState.logoutError).toEqual(fluxState.logoutError);
        }),
        { numRuns: 100 }
      );
    });

    it('should capture getSession errors in the same format as Flux', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          const reduxAction = {
            type: 'auth/getSession/rejected',
            payload: errorString,
          };

          const fluxAction = {
            type: 'GET_SESSION_ERROR',
            payload: { error: errorString },
          };

          const reduxState = authReducer(undefined, reduxAction);
          const fluxState = reducer(undefined, fluxAction);

          expect(reduxState.sessionError).toEqual(fluxState.sessionError);
          expect(reduxState.session).toEqual(fluxState.session);
        }),
        { numRuns: 100 }
      );
    });

    it('should capture updateProfile errors in the same format as Flux', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          const reduxAction = {
            type: 'auth/updateProfile/rejected',
            payload: errorString,
          };

          const fluxAction = {
            type: 'PROFILE_UPDATE_ERROR',
            payload: { error: errorString },
          };

          const reduxState = authReducer(undefined, reduxAction);
          const fluxState = reducer(undefined, fluxAction);

          expect(reduxState.profileUpdateError).toEqual(
            fluxState.profileUpdateError
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve error state across multiple failed operations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (loginError, signupError, sessionError) => {
            let state = authReducer(undefined, {});

            // Multiple errors should be stored independently
            state = authReducer(state, {
              type: 'auth/login/rejected',
              payload: loginError,
            });
            expect(state.loginError).toBe(loginError);

            state = authReducer(state, {
              type: 'auth/signup/rejected',
              payload: signupError,
            });
            expect(state.signupError).toBe(signupError);
            expect(state.loginError).toBe(loginError); // Previous error preserved

            state = authReducer(state, {
              type: 'auth/getSession/rejected',
              payload: sessionError,
            });
            expect(state.sessionError).toBe(sessionError);
            expect(state.loginError).toBe(loginError); // Previous errors preserved
            expect(state.signupError).toBe(signupError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear errors on successful operations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 10 }),
          fc.record({
            _id: fc.string({ minLength: 1 }),
            username: fc.string({ minLength: 1 }),
          }),
          (loginError, token, user) => {
            let state = authReducer(undefined, {});

            // Set an error
            state = authReducer(state, {
              type: 'auth/login/rejected',
              payload: loginError,
            });
            expect(state.loginError).toBe(loginError);

            // Successful operation should clear the error
            state = authReducer(state, {
              type: 'auth/login/fulfilled',
              payload: { token, user },
            });
            expect(state.loginError).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle errors with different formats consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1 }),
            fc.record({ message: fc.string({ minLength: 1 }) }),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (error) => {
            // Convert error to string format as thunks would
            const errorString =
              error === null || error === undefined
                ? 'Unknown error'
                : typeof error === 'string'
                  ? error
                  : error.message;

            const action = {
              type: 'auth/login/rejected',
              payload: errorString,
            };

            const state = authReducer(undefined, action);

            // Error should always be stored as a string
            expect(typeof state.loginError).toBe('string');
            expect(state.loginError).toBe(errorString);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
