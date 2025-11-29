// Import React Testing Library matchers
import '@testing-library/jest-dom';

const sessionstorage = require('sessionstorage');
const localStorage = require('localStorage');

global.localStorage = localStorage;
global.sessionStorage = sessionstorage;
