# Requirements Document: Elm to ReScript Migration

## Introduction

This document outlines the requirements for migrating all Elm components in the Docue document management system to ReScript. The application currently uses a hybrid architecture with 7 Elm components integrated into a React application. This migration is the first phase of a larger strategy to eventually migrate the entire frontend to ReScript, providing strong type safety, excellent performance, and a unified functional programming approach across the codebase.

By migrating Elm to ReScript first (rather than to JavaScript/React), we avoid double migration work and build team expertise on smaller, well-understood components before tackling the larger React codebase migration.

## Migration Strategy Analysis: React vs ReScript

### Option 1: Migrate to React (JavaScript/JSX)

**Benefits:**
- **Zero Learning Curve**: Team already knows React - no new language to learn
- **Ecosystem Alignment**: Seamless integration with existing Redux Toolkit, React Router, and all current dependencies
- **Immediate Productivity**: Can start migrating components immediately without tooling setup
- **Unified Codebase**: Entire frontend in one language (JavaScript/JSX)
- **Hiring & Onboarding**: Much larger talent pool, easier to onboard new developers
- **Community & Resources**: Massive ecosystem, extensive documentation, instant answers to questions
- **Tooling Maturity**: Excellent IDE support, debugging tools, and development experience
- **Build Simplicity**: No additional compilation steps, works with existing Vite setup
- **Maintenance**: Standard JavaScript patterns, no specialized knowledge required

**Tradeoffs:**
- **Type Safety**: Less compile-time safety than Elm/ReScript (though TypeScript could be added later)
- **Runtime Errors**: Possible null/undefined errors that Elm prevents
- **Refactoring Confidence**: Less compiler assistance during refactoring

### Option 2: Migrate to ReScript

**Benefits:**
- **Type Safety**: Strong static typing similar to Elm, catches errors at compile time
- **Elm-Like Syntax**: Easier migration path from Elm code (similar ML-family syntax)
- **React Integration**: ReScript has first-class React bindings (ReScript-React)
- **Performance**: Compiles to highly optimized JavaScript
- **Pattern Matching**: Powerful language features for handling complex logic
- **No Runtime Exceptions**: Sound type system prevents null/undefined errors

**Tradeoffs:**
- **Learning Curve**: Team must learn a new language (ReScript syntax, type system, idioms)
- **Ecosystem Fragmentation**: Would have JavaScript AND ReScript in the same codebase
- **Tooling Setup**: Requires additional build configuration, ReScript compiler, editor plugins
- **Smaller Community**: Much smaller ecosystem than React/JavaScript
- **Library Bindings**: May need to write bindings for JavaScript libraries or use unsafe interop
- **Hiring Challenge**: Very small talent pool, harder to find ReScript developers
- **Maintenance Burden**: Requires team to maintain expertise in two languages
- **Migration Complexity**: Need to create ReScript bindings for Redux Toolkit, existing utilities
- **Documentation**: Less extensive resources, fewer Stack Overflow answers
- **Long-term Risk**: Smaller community means less certain future support

### Recommendation: Migrate to ReScript (Given Long-term ReScript Goal)

**Context:** If the eventual goal is to migrate the entire frontend to ReScript, then migrating Elm components to ReScript is the strategic choice.

**Rationale:**

1. **Incremental Migration Path**: Start with Elm → ReScript (easier due to similar syntax), then gradually migrate React components. This avoids double migration (Elm → React → ReScript).

2. **Syntax Similarity**: Elm and ReScript are both ML-family languages. The migration is more direct:
   - Pattern matching translates directly
   - Type definitions are similar
   - Functional patterns are native to both
   - Port-like interop exists in ReScript

3. **Preserve Type Safety**: Maintain the compile-time guarantees that Elm provides rather than temporarily losing them in JavaScript.

4. **Learning Investment**: Team learns ReScript once on smaller, well-understood Elm components before tackling larger React components.

5. **Proof of Concept**: Validates ReScript tooling, build integration, and React bindings on a smaller scale before full migration.

6. **Avoid Rework**: Migrating Elm → React now means rewriting those same components again later (React → ReScript).

7. **Momentum**: Successfully migrating 7 Elm components to ReScript builds team confidence and expertise for the larger migration.

**Migration Strategy:**

**Phase 1: Elm → ReScript (This Spec)**
- Migrate 7 Elm components to ReScript
- Set up ReScript tooling and build pipeline
- Create ReScript bindings for Redux Toolkit
- Establish patterns for ReScript-React components
- Build team expertise on smaller components

**Phase 2: React → ReScript (Future)**
- Gradually migrate React components to ReScript
- Start with leaf components (no dependencies)
- Move up the component tree
- Maintain JavaScript/ReScript interop during transition
- Eventually achieve 100% ReScript frontend

**Benefits of This Approach:**
- **No Double Work**: Each component migrated once
- **Gradual Learning**: Team learns ReScript incrementally
- **Risk Mitigation**: Validate ReScript approach on smaller components first
- **Type Safety Continuity**: Never lose the safety Elm provides
- **Clear End Goal**: Every migration step moves toward ReScript

**Immediate Next Steps:**
1. Set up ReScript compiler and tooling
2. Configure Vite to handle ReScript files
3. Create ReScript bindings for Redux Toolkit
4. Migrate simplest component first (Landing or NotFound)
5. Establish patterns and best practices
6. Document learnings for team

**When React Migration Would Make Sense:**
- If the long-term ReScript goal is uncertain or might change
- If immediate delivery is more important than long-term architecture
- If team doesn't have capacity for ReScript learning curve

**For This Project:**
Given the stated goal of eventually moving all frontend code to ReScript, migrating Elm → ReScript is the clear strategic choice. It's more work upfront but avoids double migration and builds toward the long-term vision.

## Glossary

- **Elm Component**: A UI component written in the Elm programming language (0.19.1) that is embedded in the React application via the ReactElm wrapper
- **ReScript**: A robustly typed language that compiles to JavaScript, with first-class React support and ML-family syntax similar to Elm
- **ReScript-React**: The official React bindings for ReScript, providing type-safe React component development
- **Port**: Elm's mechanism for JavaScript interoperability, allowing communication between Elm and JavaScript code
- **External**: ReScript's mechanism for JavaScript interoperability, allowing type-safe bindings to JavaScript functions and values
- **ReactElm Wrapper**: A React component (`src/utils/ReactElm.js`) that initializes and embeds Elm applications (to be removed after migration)
- **Redux Toolkit**: The modern state management library already used in the React portions of the application
- **ReScript Binding**: Type-safe wrapper code that allows ReScript to call JavaScript libraries with compile-time type checking
- **Materialize**: The CSS framework (Materialize CSS) used for UI components and toast notifications
- **Form State**: The local component state managing form inputs, validation, and user interactions
- **API Integration**: HTTP requests to the backend API for CRUD operations on users, documents, and roles
- **bsconfig.json**: ReScript's configuration file that defines compilation settings, dependencies, and source directories

## Requirements

### Requirement 1: Login Component Migration

**User Story:** As a user, I want to log in to the application using a ReScript-based login form, so that the authentication flow maintains type safety while integrating with the Redux state management.

#### Acceptance Criteria

1. WHEN a user enters email and password THEN the system SHALL validate the inputs and enable form submission
2. WHEN a user submits the login form THEN the system SHALL dispatch the Redux login action with the credentials
3. WHEN login succeeds THEN the system SHALL store the token in localStorage and redirect to the dashboard
4. WHEN login fails THEN the system SHALL display an error toast notification using Materialize
5. WHEN the component renders THEN the system SHALL display input fields with proper labels and styling matching the current design

### Requirement 2: Profile Component Migration

**User Story:** As a user, I want to view and edit my profile information using a ReScript-based interface, so that I can update my details with compile-time safety guarantees.

#### Acceptance Criteria

1. WHEN a user views their profile THEN the system SHALL display their name, email, and role in a card layout
2. WHEN a user clicks the edit button THEN the system SHALL toggle to an edit form with pre-filled values
3. WHEN a user updates profile fields THEN the system SHALL validate the inputs in real-time
4. WHEN a user enters a new password THEN the system SHALL validate that password and confirmation match and are longer than 6 characters
5. WHEN a user submits profile updates THEN the system SHALL send a PUT request to the API with authentication token
6. WHEN profile update succeeds THEN the system SHALL update localStorage and display a success toast
7. WHEN profile update fails THEN the system SHALL display an error toast with the failure reason
8. WHEN a user cancels editing THEN the system SHALL revert to the profile view without saving changes

### Requirement 3: Admin Dashboard Component Migration

**User Story:** As an administrator, I want to view system statistics in a ReScript-based dashboard, so that I can monitor the application state with type-safe data handling.

#### Acceptance Criteria

1. WHEN an admin views the dashboard THEN the system SHALL fetch statistics from the API using the authentication token
2. WHEN statistics are loaded THEN the system SHALL display counts for users, documents, and roles
3. WHEN the API request fails THEN the system SHALL display an error message to the user
4. WHEN the component mounts THEN the system SHALL automatically trigger the statistics fetch
5. WHEN statistics are displayed THEN the system SHALL provide navigation links to manage each resource type

### Requirement 4: Roles Admin Component Migration

**User Story:** As an administrator, I want to view all roles in a ReScript-based table, so that I can manage user permissions with type-safe data rendering.

#### Acceptance Criteria

1. WHEN an admin views the roles page THEN the system SHALL fetch all roles from the API with authentication
2. WHEN roles are loaded THEN the system SHALL display them in a table with title and access level columns
3. WHEN the roles table renders THEN the system SHALL initialize Materialize tooltips for interactive elements
4. WHEN the API request fails THEN the system SHALL display an error message
5. WHEN the page displays THEN the system SHALL show a floating action button to create new roles

### Requirement 5: Create Role Component Migration

**User Story:** As an administrator, I want to create new roles using a ReScript form, so that I can define user permissions with compile-time validation.

#### Acceptance Criteria

1. WHEN an admin enters a role title THEN the system SHALL update the form state in real-time
2. WHEN an admin submits the form THEN the system SHALL dispatch a Redux action to create the role
3. WHEN role creation succeeds THEN the system SHALL redirect to the roles list page
4. WHEN role creation fails THEN the system SHALL display an error toast notification
5. WHEN the form renders THEN the system SHALL display a title input field with proper styling

### Requirement 6: Landing Page Component Migration

**User Story:** As a visitor, I want to see the landing page rendered in ReScript, so that even simple components benefit from type safety.

#### Acceptance Criteria

1. WHEN a visitor accesses the landing page THEN the system SHALL display the hero section with title and call-to-action
2. WHEN the page renders THEN the system SHALL show a "Get Started" button linking to the authentication page
3. WHEN the component mounts THEN the system SHALL render without requiring any external data fetching

### Requirement 7: Not Found Component Migration

**User Story:** As a user, I want to see a 404 error page in ReScript when I navigate to an invalid route, so that error handling is type-safe and consistent.

#### Acceptance Criteria

1. WHEN a user navigates to an invalid route THEN the system SHALL display a "Not Found" message
2. WHEN the error page renders THEN the system SHALL show a user-friendly message explaining the error
3. WHEN the component displays THEN the system SHALL use consistent styling with the rest of the application

### Requirement 8: State Management Integration

**User Story:** As a developer, I want all migrated components to use Redux Toolkit for state management through ReScript bindings, so that the application has a unified data flow architecture with type safety.

#### Acceptance Criteria

1. WHEN components need authentication state THEN the system SHALL access it from the Redux auth slice via ReScript bindings
2. WHEN components need to dispatch actions THEN the system SHALL use the Redux dispatch function via ReScript-React hooks
3. WHEN components need derived state THEN the system SHALL use Redux selectors with proper type annotations
4. WHEN form state is local to a component THEN the system SHALL use ReScript-React useState hook
5. WHEN components need side effects THEN the system SHALL use Redux async thunks via bindings or ReScript-React useEffect

### Requirement 9: API Integration Consistency

**User Story:** As a developer, I want all API calls to use the existing API client patterns, so that HTTP requests are handled consistently across the application.

#### Acceptance Criteria

1. WHEN components make API requests THEN the system SHALL use the existing API utility functions or Redux thunks
2. WHEN API requests require authentication THEN the system SHALL include the x-access-token header
3. WHEN API requests fail THEN the system SHALL handle errors consistently with existing patterns
4. WHEN API responses are received THEN the system SHALL parse and validate the data appropriately
5. WHEN making HTTP requests THEN the system SHALL use the configured base URL for the environment

### Requirement 10: Build System Configuration

**User Story:** As a developer, I want to configure the build system for ReScript compilation, so that ReScript components integrate seamlessly with the existing Vite build pipeline.

#### Acceptance Criteria

1. WHEN ReScript is added THEN the system SHALL install the ReScript compiler and React bindings
2. WHEN ReScript is configured THEN the system SHALL add a bsconfig.json with appropriate settings
3. WHEN Vite builds THEN the system SHALL compile ReScript files to JavaScript before bundling
4. WHEN development server runs THEN the system SHALL support hot module replacement for ReScript files
5. WHEN Elm components are fully migrated THEN the system SHALL remove all Elm npm packages
6. WHEN Elm is removed THEN the system SHALL remove the Elm Vite plugin configuration
7. WHEN Elm is removed THEN the system SHALL delete all .elm source files and elm.json
8. WHEN Elm is removed THEN the system SHALL delete the ReactElm wrapper utility

### Requirement 11: Testing Coverage

**User Story:** As a developer, I want comprehensive tests for all migrated ReScript components, so that I can ensure the migration maintains existing functionality with type safety.

#### Acceptance Criteria

1. WHEN components are migrated THEN the system SHALL include unit tests using React Testing Library for rendering and user interactions
2. WHEN forms are migrated THEN the system SHALL include tests for validation logic
3. WHEN API integration exists THEN the system SHALL include tests for success and error scenarios
4. WHEN Redux integration exists THEN the system SHALL include tests for action dispatching and state selection
5. WHEN ReScript components are tested THEN the system SHALL compile ReScript test files to JavaScript for Jest execution
6. WHEN all tests run THEN the system SHALL maintain or improve the current test coverage percentage

### Requirement 12: UI/UX Preservation

**User Story:** As a user, I want the migrated components to look and behave identically to the current Elm versions, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN components are migrated THEN the system SHALL preserve all existing CSS classes and styling
2. WHEN forms are migrated THEN the system SHALL maintain the same validation behavior
3. WHEN interactions occur THEN the system SHALL show the same toast notifications and feedback
4. WHEN layouts render THEN the system SHALL match the current visual design exactly
5. WHEN Materialize components are used THEN the system SHALL initialize them properly with ReScript-React lifecycle methods

### Requirement 13: ReScript Bindings and Interop

**User Story:** As a developer, I want well-typed ReScript bindings for JavaScript libraries, so that I can use existing dependencies safely from ReScript code.

#### Acceptance Criteria

1. WHEN using Redux Toolkit THEN the system SHALL provide ReScript bindings for store, dispatch, and selectors
2. WHEN using React Router THEN the system SHALL provide ReScript bindings for navigation and routing hooks
3. WHEN using Materialize THEN the system SHALL provide ReScript bindings for toast notifications and component initialization
4. WHEN calling JavaScript functions THEN the system SHALL use proper external declarations with type annotations
5. WHEN JavaScript code calls ReScript THEN the system SHALL export components with proper type signatures
6. WHEN localStorage is accessed THEN the system SHALL provide type-safe wrappers for storage operations

### Requirement 14: SignUp Component Migration (React → ReScript Pattern)

**User Story:** As a user, I want to sign up for an account using a ReScript-based form, so that account creation benefits from compile-time type safety.

#### Acceptance Criteria

1. WHEN a user enters signup form fields THEN the system SHALL update the form state in real-time
2. WHEN a user enters passwords THEN the system SHALL validate that they match and are longer than 6 characters
3. WHEN a user submits valid signup data THEN the system SHALL dispatch a Redux signup action with the user information
4. WHEN signup succeeds THEN the system SHALL store the token and user info in localStorage and redirect to the dashboard
5. WHEN signup fails THEN the system SHALL display an error toast notification with the error message
6. WHEN the component renders THEN the system SHALL display input fields for firstname, lastname, email, password, and password confirmation

### Requirement 15: React → ReScript Migration Pattern Documentation

**User Story:** As a developer, I want documented patterns for migrating React components to ReScript, so that I can confidently migrate the remaining React codebase.

#### Acceptance Criteria

1. WHEN the SignUp component is migrated THEN the system SHALL document the migration process step-by-step
2. WHEN React hooks are used THEN the system SHALL document ReScript equivalents and patterns
3. WHEN class components are encountered THEN the system SHALL document conversion to functional components with hooks
4. WHEN Redux integration is needed THEN the system SHALL document the binding patterns for hooks (useSelector, useDispatch)
5. WHEN React lifecycle methods are used THEN the system SHALL document useEffect equivalents in ReScript
6. WHEN the migration is complete THEN the system SHALL provide a migration guide for future React components

**User Story:** As a developer, I want well-typed ReScript bindings for JavaScript libraries, so that I can use existing dependencies safely from ReScript code.

#### Acceptance Criteria

1. WHEN using Redux Toolkit THEN the system SHALL provide ReScript bindings for store, dispatch, and selectors
2. WHEN using React Router THEN the system SHALL provide ReScript bindings for navigation and routing hooks
3. WHEN using Materialize THEN the system SHALL provide ReScript bindings for toast notifications and component initialization
4. WHEN calling JavaScript functions THEN the system SHALL use proper external declarations with type annotations
5. WHEN JavaScript code calls ReScript THEN the system SHALL export components with proper type signatures
6. WHEN localStorage is accessed THEN the system SHALL provide type-safe wrappers for storage operations
