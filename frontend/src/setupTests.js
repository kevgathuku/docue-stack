// Import React Testing Library matchers
import '@testing-library/jest-dom';
import sessionstorage from 'sessionstorage';
import localStorage from 'localStorage';

global.localStorage = localStorage;
global.sessionStorage = sessionstorage;
