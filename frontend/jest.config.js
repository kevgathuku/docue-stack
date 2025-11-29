export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Enable experimental ESM support
  extensionsToTreatAsEsm: ['.jsx', '.res.js'],
  
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/config/jest/fileTransform.js',
    '\\.elm$': '<rootDir>/src/__mocks__/elmMock.js',
    '^@rescript/core/(.*)$': '<rootDir>/src/__mocks__/rescriptCoreMock.js',
  },
  
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
    '^.+\\.res\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
    'node_modules/@rescript/.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(@rescript))',
  ],
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
  ],
  
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/?(*.)(spec|test).{js,jsx}',
  ],
  
  testPathIgnorePatterns: ['/node_modules/'],
};
