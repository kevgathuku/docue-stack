// Mock for Elm modules in Jest tests
// This allows tests to run without actually compiling Elm code

const createElmMock = (moduleName) => ({
  [moduleName]: {
    init: jest.fn(() => ({
      ports: {},
    })),
  },
});

// Export mocks for all Elm modules
module.exports = {
  Login: createElmMock('Login').Login,
  Admin: createElmMock('Admin').Admin,
  Profile: createElmMock('Profile').Profile,
  Landing: createElmMock('Landing').Landing,
  NotFound: createElmMock('NotFound').NotFound,
  CreateRole: createElmMock('CreateRole').CreateRole,
  RolesAdmin: createElmMock('RolesAdmin').RolesAdmin,
};
