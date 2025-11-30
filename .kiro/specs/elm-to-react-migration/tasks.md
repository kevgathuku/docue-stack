# Implementation Plan: Elm to ReScript Migration

## Overview

This plan outlines the step-by-step migration of 7 Elm components and 1 React component to ReScript, establishing patterns for the eventual full frontend migration to ReScript.

## Migration Strategy

- Start with infrastructure (bindings, types, build setup)
- Migrate simplest components first (Landing, NotFound)
- Progress to moderate complexity (Login, CreateRole, Admin, RolesAdmin)
- Tackle most complex component (Profile)
- Migrate React component (SignUp) to establish React → ReScript pattern
- Clean up Elm artifacts

---

## Tasks

- [x] 1. Set up ReScript infrastructure
  - Install ReScript compiler and React bindings
  - Configure bsconfig.json for project structure
  - Update Vite configuration to handle ReScript files
  - Verify ReScript compilation works with Vite dev server
  - Test hot module replacement for ReScript files
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Create core ReScript bindings
  - Create bindings/Redux.res for Redux Toolkit (useDispatch, useSelector)
  - Create bindings/ReactRouter.res for React Router (useNavigate)
  - Create bindings/Materialize.res for toast notifications
  - Create bindings/LocalStorage.res for localStorage operations
  - Create bindings/Fetch.res for HTTP requests
  - Write example usage tests for each binding
  - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [x] 3. Create type definitions for Redux state
  - Create features/auth/AuthTypes.res with user, credentials, and auth state types
  - Create features/roles/RoleTypes.res with role and role list types
  - Create features/documents/DocumentTypes.res with document types
  - Add JSON decoders for each type
  - _Requirements: 8.1, 8.3_

- [x] 4. Migrate Landing component (simplest - static)
  - Create components/Landing/Landing.res
  - Implement static hero section with title and CTA button
  - Export component for JavaScript interop
  - Update Landing/Landing.jsx to import compiled ReScript
  - Manually test rendering and styling
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4.1 Write unit tests for Landing component
  - Test component renders hero section
  - Test "Get Started" button has correct href
  - Test CSS classes match original Elm version
  - _Requirements: 11.1, 12.1_

- [x] 5. Migrate NotFound component (simplest - static)
  - Create components/NotFound/NotFound.res
  - Implement error message display
  - Export component for JavaScript interop
  - Update NotFound/NotFound.jsx to import compiled ReScript
  - Manually test rendering and styling
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 5.1 Write unit tests for NotFound component
  - Test component renders "Not Found" message
  - Test explanatory text is displayed
  - Test CSS classes match original Elm version
  - _Requirements: 11.1, 12.1_

- [x] 6. Migrate Login component (moderate - form with Redux)
  - Create components/Login/Login.res
  - Implement form state with useReducer
  - Implement email and password input handlers
  - Integrate with Redux using bindings (useDispatch, useSelector)
  - Implement form submission with validation
  - Handle login success (store token, navigate)
  - Handle login error (show toast)
  - Export component for JavaScript interop
  - Update Login/Login.jsx to import compiled ReScript
  - Manually test login flow end-to-end
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.1 Write property test for form state updates
  - **Property 1: Form state updates reflect input changes**
  - **Validates: Requirements 1.1**
  - Generate random email/password pairs
  - Verify form state updates correctly
  - _Requirements: 11.2_

- [ ]* 6.2 Write property test for Redux action dispatch
  - **Property 2: Form submission dispatches Redux action with credentials**
  - **Validates: Requirements 1.2**
  - Generate random valid credentials
  - Verify Redux action is dispatched with correct payload
  - _Requirements: 11.4_

- [ ]* 6.3 Write property test for login success handling
  - **Property 3: Successful login stores token and navigates**
  - **Validates: Requirements 1.3**
  - Generate random tokens
  - Verify localStorage is updated and navigation occurs
  - _Requirements: 11.3_

- [x] 6.4 Write unit tests for Login component
  - Test component renders email and password inputs
  - Test form submission with empty fields
  - Test error toast display on login failure
  - Test CSS classes match original Elm version
  - _Requirements: 11.1, 12.1_

- [ ]* 6.5 Add integration tests for Login toast notifications
  - Test error toast is displayed when login fails (mock Redux state with loginError)
  - Test success toast is displayed when login succeeds (mock Redux state with token and session)
  - Verify Materialize.showError is called with correct error message
  - Verify Materialize.showSuccess is called on successful login
  - **Note**: Current tests don't cover Requirements 1.4 (error toast display) - this gap was discovered during property test implementation
  - _Requirements: 1.4, 11.3_

- [x] 7. Migrate CreateRole component (moderate - form with Redux)
  - Create components/CreateRole/CreateRole.res
  - Implement form state with useReducer
  - Implement title input handler
  - Integrate with Redux for role creation action
  - Handle creation success (navigate to roles list)
  - Handle creation error (show toast)
  - Export component for JavaScript interop
  - Update CreateRole/CreateRole.jsx to import compiled ReScript
  - Manually test role creation flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7.1 Write property test for form state updates
  - **Property 12: Role title input updates state**
  - **Validates: Requirements 5.1**
  - Generate random title values
  - Verify form state updates correctly
  - _Requirements: 11.2_

- [ ]* 7.2 Write property test for Redux action dispatch
  - **Property 13: Role creation dispatches Redux action**
  - **Validates: Requirements 5.2**
  - Generate random role titles
  - Verify Redux action is dispatched with correct payload
  - _Requirements: 11.4_

- [x] 7.3 Write unit tests for CreateRole component
  - Test component renders title input
  - Test form submission
  - Test navigation on success
  - Test error toast on failure
  - _Requirements: 11.1, 11.3_

- [x] 8. Migrate Admin component (moderate - API fetching)
  - Create components/Admin/Admin.res
  - Implement stats state with useState
  - Implement API call on component mount with useEffect
  - Parse and validate stats response
  - Display stats counts (users, documents, roles)
  - Handle API errors (show error message)
  - Export component for JavaScript interop
  - Update Admin/Admin.jsx to import compiled ReScript
  - Manually test stats display
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 8.1 Write property test for stats display
  - **Property 10: Stats display shows all counts**
  - **Validates: Requirements 3.2**
  - Generate random stats objects
  - Verify all counts are displayed in rendered output
  - _Requirements: 11.1_

- [ ]* 8.2 Write property test for authenticated API calls
  - **Property 9: Dashboard fetches stats on mount**
  - **Validates: Requirements 3.1, 3.4**
  - Verify API call is made with authentication token
  - _Requirements: 11.3_

- [x] 8.3 Write unit tests for Admin component
  - Test component renders stats cards
  - Test navigation links are present
  - Test error message display on API failure
  - _Requirements: 11.1, 11.3_

- [x] 9. Migrate RolesAdmin component (moderate - API fetching with table)
  - Create components/RolesAdmin/RolesAdmin.res
  - Implement roles state with useState
  - Implement API call on component mount with useEffect
  - Parse and validate roles list response
  - Render roles table with title and access level columns
  - Initialize Materialize tooltips after render
  - Handle API errors (show error message)
  - Export component for JavaScript interop
  - Update RolesAdmin/RolesAdmin.jsx to import compiled ReScript
  - Manually test roles table display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 9.1 Write property test for roles table rendering
  - **Property 11: Roles table renders all role data**
  - **Validates: Requirements 4.2**
  - Generate random role lists
  - Verify each role is displayed with title and access level
  - _Requirements: 11.1_

- [x] 9.2 Write unit tests for RolesAdmin component
  - Test component renders table structure
  - Test floating action button is present
  - Test Materialize tooltip initialization
  - Test error message display on API failure
  - _Requirements: 11.1, 11.3_

- [x] 10. Checkpoint - Verify moderate complexity components
  - Ensure all tests pass for Login, CreateRole, Admin, RolesAdmin
  - Manually test each component in the browser
  - Verify Redux integration works correctly
  - Verify API calls work with authentication
  - Verify navigation works correctly
  - Ask the user if questions arise

- [ ] 11. Migrate Profile component (most complex - view/edit toggle, validation, API)
  - Create components/Profile/Profile.res
  - Implement view mode and edit mode states
  - Implement profile view with user data display
  - Implement edit form with all input fields
  - Implement view/edit toggle functionality
  - Implement password validation (match, length > 6)
  - Implement profile update API call with authentication
  - Handle update success (update localStorage, show toast, return to view mode)
  - Handle update error (show toast)
  - Export component for JavaScript interop
  - Update Profile/Profile.jsx to import compiled ReScript
  - Manually test profile view and edit flow
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ]* 11.1 Write property test for profile data display
  - **Property 4: Profile view displays all user data**
  - **Validates: Requirements 2.1**
  - Generate random user objects
  - Verify all user data is displayed in rendered output
  - _Requirements: 11.1_

- [ ]* 11.2 Write property test for view/edit toggle
  - **Property 5: Edit toggle transitions state correctly**
  - **Validates: Requirements 2.2, 2.8**
  - Test state transitions between ProfileView and EditView
  - Verify cancel returns to ProfileView without saving
  - _Requirements: 11.1_

- [ ]* 11.3 Write property test for password validation
  - **Property 6: Password validation enforces rules**
  - **Validates: Requirements 2.4**
  - Generate random password pairs
  - Verify validation returns correct result (Empty, Valid, Invalid)
  - Test mismatch detection
  - Test length validation (> 6 characters)
  - _Requirements: 11.2_

- [ ]* 11.4 Write property test for profile update authentication
  - **Property 7: Profile update includes authentication**
  - **Validates: Requirements 2.5**
  - Verify API request includes x-access-token header
  - _Requirements: 11.3_

- [ ]* 11.5 Write property test for update success handling
  - **Property 8: Successful update refreshes localStorage**
  - **Validates: Requirements 2.6**
  - Generate random user update responses
  - Verify localStorage is updated and success toast is shown
  - _Requirements: 11.3_

- [x] 11.6 Write unit tests for Profile component
  - Test profile view renders user information
  - Test edit button toggles to edit form
  - Test cancel button returns to profile view
  - Test form inputs update state
  - Test password mismatch shows error toast
  - Test password too short shows error toast
  - Test successful update shows success toast
  - Test API error shows error toast
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 12. Migrate SignUp component (React → ReScript pattern)
  - Create components/SignUp/SignUp.res
  - Implement form state with useReducer (firstname, lastname, email, password, passwordConfirm)
  - Implement input handlers for all fields
  - Implement password validation (match, length > 6)
  - Integrate with Redux using bindings (useDispatch, useSelector)
  - Implement form submission with validation
  - Handle signup success (store token and user, navigate to dashboard)
  - Handle signup error (show toast)
  - Export component for JavaScript interop
  - Update SignUp/SignUp.jsx to import compiled ReScript
  - Manually test signup flow end-to-end
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ]* 12.1 Write property test for form state updates
  - **Property 23: SignUp form state updates reflect input changes**
  - **Validates: Requirements 14.1**
  - Generate random form field values
  - Verify form state updates correctly for each field
  - _Requirements: 11.2_

- [ ]* 12.2 Write property test for password validation
  - **Property 24: Password validation enforces matching and length**
  - **Validates: Requirements 14.2**
  - Generate random password pairs
  - Verify validation rejects mismatched passwords
  - Verify validation rejects passwords with length 1-5
  - Verify validation accepts matching passwords > 6 chars
  - _Requirements: 11.2_

- [ ]* 12.3 Write property test for Redux action dispatch
  - **Property 25: Valid signup dispatches Redux action**
  - **Validates: Requirements 14.3**
  - Generate random valid signup data
  - Verify Redux action is dispatched with correct payload
  - _Requirements: 11.4_

- [ ]* 12.4 Write property test for signup success handling
  - **Property 26: Successful signup stores token and navigates**
  - **Validates: Requirements 14.4**
  - Generate random signup success responses
  - Verify token and user are stored in localStorage
  - Verify navigation to dashboard occurs
  - _Requirements: 11.3_

- [ ]* 12.5 Write unit tests for SignUp component
  - Test component renders all input fields
  - Test form submission with valid data
  - Test password mismatch shows error toast
  - Test password too short shows error toast
  - Test successful signup shows success toast
  - Test signup error shows error toast
  - Test CSS classes match original React version
  - _Requirements: 11.1, 11.3, 12.1_

- [x] 13. Document React → ReScript migration patterns
  - Create REACT_TO_RESCRIPT_MIGRATION.md guide
  - Document class component to functional component conversion
  - Document React hooks equivalents in ReScript (useState, useEffect, useReducer)
  - Document Redux integration patterns (useSelector, useDispatch bindings)
  - Document event handling patterns in ReScript-React
  - Document form validation patterns
  - Document API integration patterns
  - Include code examples from SignUp migration
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [x] 14. Write cross-component property tests
  - Write property test for error toast display
  - **Property 15: Error responses show toast notifications**
  - **Validates: Requirements 1.4, 2.7, 3.3, 4.4, 5.4**
  - Generate random error responses
  - Verify error toast is displayed with correct message
  - _Requirements: 11.3_

- [ ]* 14.1 Write property test for authenticated API calls
  - **Property 16: Authenticated API calls include token header**
  - **Validates: Requirements 9.2**
  - Generate random API requests
  - Verify x-access-token header is present
  - _Requirements: 11.3_

- [ ]* 14.2 Write property test for API response parsing
  - **Property 17: API responses are parsed and validated**
  - **Validates: Requirements 9.4**
  - Generate random API responses
  - Verify parsing and validation occurs before data use
  - _Requirements: 11.3_

- [ ]* 14.3 Write property test for base URL usage
  - **Property 18: API calls use correct base URL**
  - **Validates: Requirements 9.5**
  - Generate random API endpoints
  - Verify URLs start with configured base URL
  - _Requirements: 11.3_

- [ ]* 14.4 Write property test for CSS class preservation
  - **Property 19: Migrated components preserve CSS classes**
  - **Validates: Requirements 12.1**
  - Compare rendered HTML of ReScript components with original Elm/React
  - Verify CSS classes match
  - _Requirements: 11.1_

- [ ]* 14.5 Write property test for validation behavior consistency
  - **Property 20: Form validation behavior matches Elm**
  - **Validates: Requirements 12.2**
  - Test same inputs against Elm and ReScript validation
  - Verify same validation results and error messages
  - _Requirements: 11.2_

- [ ]* 14.6 Write property test for toast notification consistency
  - **Property 21: User feedback matches Elm behavior**
  - **Validates: Requirements 12.3**
  - Test same interactions in Elm and ReScript components
  - Verify same toasts are shown with same messages
  - _Requirements: 11.1_

- [ ]* 14.7 Write property test for Materialize initialization
  - **Property 22: Materialize components initialize correctly**
  - **Validates: Requirements 12.5**
  - Verify initialization functions are called after render
  - Test with components using tooltips, modals, etc.
  - _Requirements: 11.1_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run full test suite for all migrated components
  - Verify test coverage meets 80% minimum
  - Verify all property tests pass with 100+ iterations
  - Manually test all components in browser
  - Test full user flows (login, signup, profile edit, role creation)
  - Verify no console errors
  - Ensure all tests pass, ask the user if questions arise

- [x] 16. Clean up Elm artifacts
  - Remove all .elm files from src/components/
  - Remove elm.json configuration file
  - Remove Elm npm packages (elm, elm-webpack-loader, etc.)
  - Remove Elm Vite plugin from vite.config.js
  - Remove ReactElm wrapper (src/utils/ReactElm.js)
  - Remove Elm mocks from __mocks__/
  - Update package.json scripts to remove Elm references
  - _Requirements: 10.5, 10.6, 10.7, 10.8_

- [ ] 17. Update documentation
  - Update frontend/README.md to reflect ReScript usage
  - Update frontend/MODERNIZATION.md with ReScript migration details
  - Update frontend/RESCRIPT_GUIDE.md with ReScript patterns and best practices
  - Document ReScript bindings usage
  - Document build and development workflow
  - Update component documentation
  - _Requirements: 15.6_

- [ ] 18. Final verification
  - Run full test suite one final time
  - Verify all 204+ tests pass
  - Run production build and verify it succeeds
  - Test production build in browser
  - Verify no Elm-related errors or warnings
  - Verify HMR works for ReScript files
  - Performance test (ensure no degradation)
  - Accessibility test (ensure no regressions)

---

## Success Criteria

- ✅ All 8 components migrated to ReScript
- ✅ All tests passing (unit and property tests)
- ✅ Test coverage ≥ 80%
- ✅ No Elm dependencies remaining
- ✅ Build completes without Elm compilation
- ✅ All user flows working identically to before
- ✅ UI/UX identical to original
- ✅ React → ReScript migration pattern documented
- ✅ Team ready for Phase 2 (React → ReScript migration)

## Notes

- Property tests should run with at least 100 iterations
- Each property test must reference the correctness property it validates
- Manual testing is required after each component migration
- Keep Elm versions until ReScript versions are fully verified
- Document any issues or learnings for future migrations
