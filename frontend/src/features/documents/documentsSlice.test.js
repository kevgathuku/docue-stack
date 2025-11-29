import { configureStore } from '@reduxjs/toolkit';
import documentsReducer, {
  selectDocuments,
  selectDocument,
  selectDocCreateResult,
  selectDocEditResult,
  selectDocDeleteResult,
  selectDocumentsLoading,
  selectDocumentsError,
} from './documentsSlice';

describe('documentsSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        documents: documentsReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().documents;
      expect(state).toEqual({
        doc: null,
        docs: null,
        docCreateResult: null,
        docDeleteResult: null,
        docEditResult: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('reducer logic', () => {
    describe('fetchDocuments', () => {
      it('should handle fetchDocuments.pending', () => {
        const action = {
          type: 'documents/fetchDocuments/pending',
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle fetchDocuments.fulfilled', () => {
        const mockDocs = [
          { _id: '1', title: 'Doc 1', content: 'Content 1' },
          { _id: '2', title: 'Doc 2', content: 'Content 2' },
        ];

        const action = {
          type: 'documents/fetchDocuments/fulfilled',
          payload: mockDocs,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.docs).toEqual(mockDocs);
        expect(newState.error).toBeNull();
      });

      it('should handle fetchDocuments.rejected', () => {
        const mockError = 'Failed to fetch documents';

        const action = {
          type: 'documents/fetchDocuments/rejected',
          payload: mockError,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });
    });

    describe('fetchDocument', () => {
      it('should handle fetchDocument.pending', () => {
        const action = {
          type: 'documents/fetchDocument/pending',
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle fetchDocument.fulfilled', () => {
        const mockDoc = { _id: '1', title: 'Doc 1', content: 'Content 1' };

        const action = {
          type: 'documents/fetchDocument/fulfilled',
          payload: mockDoc,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.doc).toEqual(mockDoc);
        expect(newState.error).toBeNull();
      });

      it('should handle fetchDocument.rejected', () => {
        const mockError = 'Document not found';

        const action = {
          type: 'documents/fetchDocument/rejected',
          payload: mockError,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });
    });

    describe('createDocument', () => {
      it('should handle createDocument.pending', () => {
        const action = {
          type: 'documents/createDocument/pending',
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle createDocument.fulfilled', () => {
        const mockDoc = { _id: '1', title: 'New Doc', content: 'New Content' };

        const action = {
          type: 'documents/createDocument/fulfilled',
          payload: mockDoc,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.docCreateResult).toEqual(mockDoc);
        expect(newState.error).toBeNull();
      });

      it('should handle createDocument.rejected', () => {
        const mockError = 'Failed to create document';

        const action = {
          type: 'documents/createDocument/rejected',
          payload: mockError,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });
    });

    describe('editDocument', () => {
      it('should handle editDocument.pending', () => {
        const action = {
          type: 'documents/editDocument/pending',
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle editDocument.fulfilled', () => {
        const mockResult = {
          data: { _id: '1', title: 'Updated Doc', content: 'Updated Content' },
          statusCode: 200,
        };

        const action = {
          type: 'documents/editDocument/fulfilled',
          payload: mockResult,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.docEditResult).toEqual(mockResult);
        expect(newState.error).toBeNull();
      });

      it('should handle editDocument.rejected', () => {
        const mockError = 'Failed to edit document';

        const action = {
          type: 'documents/editDocument/rejected',
          payload: mockError,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });
    });

    describe('deleteDocument', () => {
      it('should handle deleteDocument.pending', () => {
        const action = {
          type: 'documents/deleteDocument/pending',
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle deleteDocument.fulfilled', () => {
        const mockResult = {
          data: { message: 'Document deleted' },
          statusCode: 200,
        };

        const action = {
          type: 'documents/deleteDocument/fulfilled',
          payload: mockResult,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.docDeleteResult).toEqual(mockResult);
        expect(newState.error).toBeNull();
      });

      it('should handle deleteDocument.rejected', () => {
        const mockError = 'Failed to delete document';

        const action = {
          type: 'documents/deleteDocument/rejected',
          payload: mockError,
        };

        const newState = documentsReducer(undefined, action);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(mockError);
      });
    });
  });

  describe('selectors', () => {
    it('should select documents', () => {
      const mockDocs = [{ _id: '1', title: 'Doc 1' }];
      const state = {
        documents: { ...store.getState().documents, docs: mockDocs },
      };
      expect(selectDocuments(state)).toEqual(mockDocs);
    });

    it('should select document', () => {
      const mockDoc = { _id: '1', title: 'Doc 1' };
      const state = {
        documents: { ...store.getState().documents, doc: mockDoc },
      };
      expect(selectDocument(state)).toEqual(mockDoc);
    });

    it('should select docCreateResult', () => {
      const mockResult = { _id: '1', title: 'New Doc' };
      const state = {
        documents: { ...store.getState().documents, docCreateResult: mockResult },
      };
      expect(selectDocCreateResult(state)).toEqual(mockResult);
    });

    it('should select docEditResult', () => {
      const mockResult = { data: { _id: '1' }, statusCode: 200 };
      const state = {
        documents: { ...store.getState().documents, docEditResult: mockResult },
      };
      expect(selectDocEditResult(state)).toEqual(mockResult);
    });

    it('should select docDeleteResult', () => {
      const mockResult = { data: { message: 'Deleted' }, statusCode: 200 };
      const state = {
        documents: {
          ...store.getState().documents,
          docDeleteResult: mockResult,
        },
      };
      expect(selectDocDeleteResult(state)).toEqual(mockResult);
    });

    it('should select loading', () => {
      const state = {
        documents: { ...store.getState().documents, loading: true },
      };
      expect(selectDocumentsLoading(state)).toBe(true);
    });

    it('should select error', () => {
      const mockError = 'Error message';
      const state = {
        documents: { ...store.getState().documents, error: mockError },
      };
      expect(selectDocumentsError(state)).toBe(mockError);
    });
  });
});
