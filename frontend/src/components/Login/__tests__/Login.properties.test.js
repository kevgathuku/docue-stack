/**
 * Property-Based Tests for Login ReScript Component
 *
 * These tests verify that the Login component maintains correct form state
 * management behavior across all possible input combinations.
 */

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../../../features/auth/authSlice';
import Login from '../Login.res.js';

describe('Login Component Property-Based Tests', () => {
  // Helper to create a fresh store for each test
  const createMockStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  };

  // Helper to render component with providers
  const renderWithProviders = (component, store) => {
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

  beforeEach(() => {
    // Mock Materialize toast - matches the signature from Materialize.res
    // toast: (message: string, duration: int, className: string) => unit
    global.window.Materialize = {
      toast: (_message, _duration, _className) => {},
    };

    // Mock localStorage
    global.localStorage = {
      setItem: () => {},
      getItem: () => null,
      removeItem: () => {},
      clear: () => {},
    };
  });

  /**
   * **Feature: elm-to-react-migration, Property 1: Form state updates reflect input changes**
   * **Validates: Requirements 1.1**
   *
   * For any login form and any valid email/password input, updating the input field
   * should result in the form state containing that exact value.
   */
  describe('Property 1: Form state updates reflect input changes', () => {
    // Arbitrary for generating email addresses
    const emailArb = fc.emailAddress();

    // Arbitrary for generating passwords (any string)
    const passwordArb = fc.string({ minLength: 0, maxLength: 50 });

    it('should update email field state for any valid email input', () => {
      fc.assert(
        fc.property(emailArb, (email) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const emailInput = screen.getByLabelText(/email address/i);

          // Simulate user typing email
          fireEvent.change(emailInput, { target: { value: email } });

          // Verify the input value reflects the change
          expect(emailInput.value).toBe(email);
        }),
        { numRuns: 20 }
      );
    });

    it('should update password field state for any password input', () => {
      fc.assert(
        fc.property(passwordArb, (password) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const passwordInput = screen.getByLabelText(/password/i);

          // Simulate user typing password
          fireEvent.change(passwordInput, { target: { value: password } });

          // Verify the input value reflects the change
          expect(passwordInput.value).toBe(password);
        }),
        { numRuns: 20 }
      );
    });

    it('should update both email and password fields independently', () => {
      fc.assert(
        fc.property(emailArb, passwordArb, (email, password) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const emailInput = screen.getByLabelText(/email address/i);
          const passwordInput = screen.getByLabelText(/password/i);

          // Simulate user typing both fields
          fireEvent.change(emailInput, { target: { value: email } });
          fireEvent.change(passwordInput, { target: { value: password } });

          // Verify both inputs reflect their respective changes
          expect(emailInput.value).toBe(email);
          expect(passwordInput.value).toBe(password);
        }),
        { numRuns: 20 }
      );
    });

    it('should handle multiple updates to the same field', () => {
      fc.assert(
        fc.property(fc.array(emailArb, { minLength: 1, maxLength: 5 }), (emails) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const emailInput = screen.getByLabelText(/email address/i);

          // Simulate user typing and changing their mind multiple times
          emails.forEach((email) => {
            fireEvent.change(emailInput, { target: { value: email } });
          });

          // Verify the input value reflects the last change
          expect(emailInput.value).toBe(emails[emails.length - 1]);
        }),
        { numRuns: 20 }
      );
    });

    it('should preserve email state when password is updated', () => {
      fc.assert(
        fc.property(emailArb, passwordArb, passwordArb, (email, password1, password2) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const emailInput = screen.getByLabelText(/email address/i);
          const passwordInput = screen.getByLabelText(/password/i);

          // Set email first
          fireEvent.change(emailInput, { target: { value: email } });

          // Update password multiple times
          fireEvent.change(passwordInput, { target: { value: password1 } });
          fireEvent.change(passwordInput, { target: { value: password2 } });

          // Email should remain unchanged
          expect(emailInput.value).toBe(email);
          expect(passwordInput.value).toBe(password2);
        }),
        { numRuns: 20 }
      );
    });

    it('should preserve password state when email is updated', () => {
      fc.assert(
        fc.property(emailArb, emailArb, passwordArb, (email1, email2, password) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const emailInput = screen.getByLabelText(/email address/i);
          const passwordInput = screen.getByLabelText(/password/i);

          // Set password first
          fireEvent.change(passwordInput, { target: { value: password } });

          // Update email multiple times
          fireEvent.change(emailInput, { target: { value: email1 } });
          fireEvent.change(emailInput, { target: { value: email2 } });

          // Password should remain unchanged
          expect(passwordInput.value).toBe(password);
          expect(emailInput.value).toBe(email2);
        }),
        { numRuns: 20 }
      );
    });

    it('should handle empty string inputs correctly', () => {
      fc.assert(
        fc.property(emailArb, passwordArb, (email, password) => {
          const store = createMockStore();
          renderWithProviders(<Login />, store);

          const emailInput = screen.getByLabelText(/email address/i);
          const passwordInput = screen.getByLabelText(/password/i);

          // Set values
          fireEvent.change(emailInput, { target: { value: email } });
          fireEvent.change(passwordInput, { target: { value: password } });

          // Clear values
          fireEvent.change(emailInput, { target: { value: '' } });
          fireEvent.change(passwordInput, { target: { value: '' } });

          // Both should be empty
          expect(emailInput.value).toBe('');
          expect(passwordInput.value).toBe('');
        }),
        { numRuns: 20 }
      );
    });

    it('should handle special characters in email and password', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (emailPart, password) => {
            const store = createMockStore();
            renderWithProviders(<Login />, store);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            // Use the string as-is for password (can contain special chars)
            fireEvent.change(emailInput, { target: { value: emailPart } });
            fireEvent.change(passwordInput, { target: { value: password } });

            // Values should be preserved exactly
            expect(emailInput.value).toBe(emailPart);
            expect(passwordInput.value).toBe(password);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain form state across rapid input changes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(emailArb, passwordArb), { minLength: 1, maxLength: 10 }),
          (inputPairs) => {
            const store = createMockStore();
            renderWithProviders(<Login />, store);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            // Simulate rapid typing
            inputPairs.forEach(([email, password]) => {
              fireEvent.change(emailInput, { target: { value: email } });
              fireEvent.change(passwordInput, { target: { value: password } });
            });

            // Final values should match the last input pair
            const [lastEmail, lastPassword] = inputPairs[inputPairs.length - 1];
            expect(emailInput.value).toBe(lastEmail);
            expect(passwordInput.value).toBe(lastPassword);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle very long input strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 500 }),
          fc.string({ minLength: 100, maxLength: 500 }),
          (longEmail, longPassword) => {
            const store = createMockStore();
            renderWithProviders(<Login />, store);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            // Set very long values
            fireEvent.change(emailInput, { target: { value: longEmail } });
            fireEvent.change(passwordInput, { target: { value: longPassword } });

            // Values should be preserved exactly, even if very long
            expect(emailInput.value).toBe(longEmail);
            expect(passwordInput.value).toBe(longPassword);
          }
        ),
        { numRuns: 10 } // Fewer runs for performance with long strings
      );
    });
  });
});
