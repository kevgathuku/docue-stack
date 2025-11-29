// Mock for Elm modules in Jest tests
// This allows tests to run without actually compiling Elm code

const createElmMock = () => ({
  init: jest.fn(() => ({
    ports: {},
  })),
});

// Export mocks for all Elm modules
// Each module should have an init function directly
module.exports = {
  Login: createElmMock(),
  Admin: createElmMock(),
  Profile: createElmMock(),
  Landing: createElmMock(),
  NotFound: createElmMock(),
  CreateRole: createElmMock(),
  RolesAdmin: createElmMock(),
};
