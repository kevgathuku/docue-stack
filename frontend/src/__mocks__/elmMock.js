// Mock for Elm modules in Jest tests
// This allows tests to run without actually compiling Elm code

import { jest } from '@jest/globals';

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
export default mockModules;
export const { Login, Admin, Profile, Landing, NotFound, CreateRole, RolesAdmin } = mockModules;
export const Elm = mockModules;
