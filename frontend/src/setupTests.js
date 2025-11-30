// Import React Testing Library matchers
import '@testing-library/jest-dom';
import localStorage from 'localStorage';
import sessionstorage from 'sessionstorage';

global.localStorage = localStorage;
global.sessionStorage = sessionstorage;
