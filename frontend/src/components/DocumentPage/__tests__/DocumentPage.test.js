'use strict';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import DocumentPage from '../index.jsx';
import documentsReducer from '../../../features/documents/documentsSlice';
import rolesReducer from '../../../features/roles/rolesSlice';

jest.mock('sweetalert');
import swal from 'sweetalert';

describe('DocumentPage', function() {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        documents: documentsReducer,
        roles: rolesReducer,
      },
    });
    
    // Set up localStorage
    localStorage.setItem('user', 'test-token');
    localStorage.setItem('userInfo', JSON.stringify({
      _id: '123',
      name: { first: 'Test', last: 'User' }
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', function() {
    it('renders the correct component', function() {
      const { container } = render(
        <BrowserRouter>
          <Provider store={store}>
            <DocumentPage match={{ params: { id: '4' } }} />
          </Provider>
        </BrowserRouter>
      );
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.fixed-action-btn')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(
        <BrowserRouter>
          <Provider store={store}>
            <DocumentPage match={{ params: { id: '4' } }} />
          </Provider>
        </BrowserRouter>
      );
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  describe('Component with document data', function() {
    beforeEach(() => {
      const doc = {
        _id: '4',
        title: 'Test Document',
        content: 'Hello from the other side',
        dateCreated: '2016-02-15T15:10:34.000Z',
        ownerId: {
          _id: '123',
          name: {
            first: 'Kevin',
            last: 'Test'
          }
        }
      };

      store = configureStore({
        reducer: {
          documents: documentsReducer,
          roles: rolesReducer,
        },
        preloadedState: {
          documents: {
            doc,
            docs: null,
            docCreateResult: null,
            docDeleteResult: null,
            docEditResult: null,
            loading: false,
            error: null,
          },
          roles: {
            roles: [
              { _id: '1', title: 'viewer', accessLevel: 0 },
              { _id: '2', title: 'admin', accessLevel: 2 }
            ],
            createdRole: null,
            loading: false,
            error: null,
          }
        }
      });
    });

    it('should correctly display document content', function() {
      const { container } = render(
        <BrowserRouter>
          <Provider store={store}>
            <DocumentPage match={{ params: { id: '4' } }} />
          </Provider>
        </BrowserRouter>
      );
      
      expect(screen.getByText(/Test Document/i)).toBeInTheDocument();
      // Check that the content is in the document
      const contentDiv = container.querySelector('div.col.s10.offset-s1');
      expect(contentDiv).toHaveTextContent('Hello from the other side');
    });
  });
});
