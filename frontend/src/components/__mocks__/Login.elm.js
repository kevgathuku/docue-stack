// Manual mock for Login.elm in ESM mode
// This avoids the jest.mock() factory function circular dependency issue

const mockInit = () => ({
  ports: {
    handleSubmit: {
      subscribe: () => {},
    },
  },
});

export const Elm = {
  Login: {
    init: mockInit,
  },
};
