// Mock for Elm modules in Jest tests
// This allows tests to run without actually compiling Elm code

const createElmMock = () => ({
  init: jest.fn(() => ({
    ports: {},
  })),
});

// Export mocks for all Elm modules
// The structure matches what ReactElm expects: either direct .init or .Elm.ModuleName.init
const mockModules = {
  Login: createElmMock(),
  Admin: createElmMock(),
  Profile: createElmMock(),
  Landing: createElmMock(),
  NotFound: createElmMock(),
  CreateRole: createElmMock(),
  RolesAdmin: createElmMock(),
};

// Export with both direct access and nested Elm structure for compatibility
module.exports = {
  ...mockModules,
  default: mockModules,
  Elm: mockModules,
};
