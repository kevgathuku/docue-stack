import * as fc from 'fast-check';
import { configureStore } from '@reduxjs/toolkit';
import documentsReducer from './documentsSlice';

/**
 * Property-Based Tests for Documents Slice
 * 
 * **Feature: flux-to-redux-migration, Property 1: State management equivalence (documents)**
 * **Feature: flux-to-redux-migration, Property 5: Document operations preservation**
 * **Validates: Requirements 2.1, 5.2**
 * 
 * These tests verify that the Redux Toolkit documents slice maintains
 * correct state management behavior for all document operations.
 * 
 * Note: Unlike auth, documents don't have a Flux reducer to compare against,
 * only a DocStore. These tests verify internal consistency and correct
 * state transitions for all document operations.
 */

describe('Documents Slice Property-Based Tests', () => {
  // Arbitraries for generating test data
  const documentArb = fc.record({
    _id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    content: fc.string({ minLength: 0, maxLength: 500 }),
    ownerId: fc.string({ minLength: 1 }),
  });

  const documentsArrayArb = fc.array(documentArb, { minLength: 0, maxLength: 10 });

  const errorArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.record({
      message: fc.string({ minLength: 1 }),
      code: fc.integer({ min: 400, max: 599 }),
    })
  );

  const statusCodeArb = fc.integer({ min: 200, max: 299 });

  describe('Property 1 & 5: State management equivalence and document operations preservation', () => {
    it('should maintain correct state for fetchDocuments operations', () => {
      fc.assert(
        fc.property(documentsArrayArb, (docs) => {
          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/fetchDocuments/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          state = documentsReducer(state, {
            type: 'documents/fetchDocuments/fulfilled',
            payload: docs,
          });
          expect(state.loading).toBe(false);
          expect(state.docs).toEqual(docs);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle fetchDocuments errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/fetchDocuments/pending',
          });
          expect(state.loading).toBe(true);

          // Rejected state
          state = documentsReducer(state, {
            type: 'documents/fetchDocuments/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain correct state for fetchDocument operations', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/fetchDocument/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          state = documentsReducer(state, {
            type: 'documents/fetchDocument/fulfilled',
            payload: doc,
          });
          expect(state.loading).toBe(false);
          expect(state.doc).toEqual(doc);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle fetchDocument errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/fetchDocument/pending',
          });

          // Rejected state
          state = documentsReducer(state, {
            type: 'documents/fetchDocument/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain correct state for createDocument operations', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/createDocument/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          state = documentsReducer(state, {
            type: 'documents/createDocument/fulfilled',
            payload: doc,
          });
          expect(state.loading).toBe(false);
          expect(state.docCreateResult).toEqual(doc);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle createDocument errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/createDocument/pending',
          });

          // Rejected state
          state = documentsReducer(state, {
            type: 'documents/createDocument/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain correct state for editDocument operations', () => {
      fc.assert(
        fc.property(documentArb, statusCodeArb, (doc, statusCode) => {
          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/editDocument/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          const result = { data: doc, statusCode };
          state = documentsReducer(state, {
            type: 'documents/editDocument/fulfilled',
            payload: result,
          });
          expect(state.loading).toBe(false);
          expect(state.docEditResult).toEqual(result);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle editDocument errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/editDocument/pending',
          });

          // Rejected state
          state = documentsReducer(state, {
            type: 'documents/editDocument/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain correct state for deleteDocument operations', () => {
      fc.assert(
        fc.property(statusCodeArb, (statusCode) => {
          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/deleteDocument/pending',
          });
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();

          // Fulfilled state
          const result = { data: { message: 'Document deleted' }, statusCode };
          state = documentsReducer(state, {
            type: 'documents/deleteDocument/fulfilled',
            payload: result,
          });
          expect(state.loading).toBe(false);
          expect(state.docDeleteResult).toEqual(result);
          expect(state.error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle deleteDocument errors correctly', () => {
      fc.assert(
        fc.property(errorArb, (error) => {
          const errorString = typeof error === 'string' ? error : error.message;

          let state = documentsReducer(undefined, {});

          // Pending state
          state = documentsReducer(state, {
            type: 'documents/deleteDocument/pending',
          });

          // Rejected state
          state = documentsReducer(state, {
            type: 'documents/deleteDocument/rejected',
            payload: errorString,
          });
          expect(state.loading).toBe(false);
          expect(state.error).toBe(errorString);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain state consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          documentsArrayArb,
          documentArb,
          documentArb,
          (docs, newDoc, updatedDoc) => {
            let state = documentsReducer(undefined, {});

            // Fetch documents
            state = documentsReducer(state, {
              type: 'documents/fetchDocuments/fulfilled',
              payload: docs,
            });
            expect(state.docs).toEqual(docs);

            // Create a document
            state = documentsReducer(state, {
              type: 'documents/createDocument/fulfilled',
              payload: newDoc,
            });
            expect(state.docCreateResult).toEqual(newDoc);
            expect(state.docs).toEqual(docs); // Original docs unchanged

            // Edit a document
            state = documentsReducer(state, {
              type: 'documents/editDocument/fulfilled',
              payload: { data: updatedDoc, statusCode: 200 },
            });
            expect(state.docEditResult.data).toEqual(updatedDoc);
            expect(state.docs).toEqual(docs); // Original docs still unchanged
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear errors on successful operations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          documentsArrayArb,
          (error, docs) => {
            let state = documentsReducer(undefined, {});

            // Set an error
            state = documentsReducer(state, {
              type: 'documents/fetchDocuments/rejected',
              payload: error,
            });
            expect(state.error).toBe(error);

            // Successful operation should clear the error
            state = documentsReducer(state, {
              type: 'documents/fetchDocuments/fulfilled',
              payload: docs,
            });
            expect(state.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle loading state correctly across operations', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          let state = documentsReducer(undefined, {});

          // Initial state should not be loading
          expect(state.loading).toBe(false);

          // Pending should set loading to true
          state = documentsReducer(state, {
            type: 'documents/fetchDocument/pending',
          });
          expect(state.loading).toBe(true);

          // Fulfilled should set loading to false
          state = documentsReducer(state, {
            type: 'documents/fetchDocument/fulfilled',
            payload: doc,
          });
          expect(state.loading).toBe(false);

          // Another pending should set loading back to true
          state = documentsReducer(state, {
            type: 'documents/createDocument/pending',
          });
          expect(state.loading).toBe(true);

          // Rejected should also set loading to false
          state = documentsReducer(state, {
            type: 'documents/createDocument/rejected',
            payload: 'Error',
          });
          expect(state.loading).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve independent result fields across operations', () => {
      fc.assert(
        fc.property(
          documentArb,
          documentArb,
          documentArb,
          (doc1, doc2, doc3) => {
            let state = documentsReducer(undefined, {});

            // Set doc (single document)
            state = documentsReducer(state, {
              type: 'documents/fetchDocument/fulfilled',
              payload: doc1,
            });
            expect(state.doc).toEqual(doc1);

            // Set docCreateResult
            state = documentsReducer(state, {
              type: 'documents/createDocument/fulfilled',
              payload: doc2,
            });
            expect(state.docCreateResult).toEqual(doc2);
            expect(state.doc).toEqual(doc1); // doc should be unchanged

            // Set docEditResult
            state = documentsReducer(state, {
              type: 'documents/editDocument/fulfilled',
              payload: { data: doc3, statusCode: 200 },
            });
            expect(state.docEditResult.data).toEqual(doc3);
            expect(state.doc).toEqual(doc1); // doc should still be unchanged
            expect(state.docCreateResult).toEqual(doc2); // docCreateResult should still be unchanged
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle error formats consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1 }),
            fc.record({ message: fc.string({ minLength: 1 }) }),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (error) => {
            // Convert error to string format as thunks would
            const errorString =
              error === null || error === undefined
                ? 'Unknown error'
                : typeof error === 'string'
                  ? error
                  : error.message;

            const action = {
              type: 'documents/fetchDocuments/rejected',
              payload: errorString,
            };

            const state = documentsReducer(undefined, action);

            // Error should always be stored as a string
            expect(typeof state.error).toBe('string');
            expect(state.error).toBe(errorString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain state integrity through complex operation sequences', () => {
      fc.assert(
        fc.property(
          documentsArrayArb,
          documentArb,
          fc.string({ minLength: 1 }),
          documentArb,
          (docs, newDoc, error, updatedDoc) => {
            let state = documentsReducer(undefined, {});

            // Successful fetch
            state = documentsReducer(state, {
              type: 'documents/fetchDocuments/pending',
            });
            state = documentsReducer(state, {
              type: 'documents/fetchDocuments/fulfilled',
              payload: docs,
            });
            expect(state.docs).toEqual(docs);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();

            // Failed create
            state = documentsReducer(state, {
              type: 'documents/createDocument/pending',
            });
            state = documentsReducer(state, {
              type: 'documents/createDocument/rejected',
              payload: error,
            });
            expect(state.error).toBe(error);
            expect(state.docs).toEqual(docs); // Previous data preserved

            // Successful create (retry)
            state = documentsReducer(state, {
              type: 'documents/createDocument/pending',
            });
            state = documentsReducer(state, {
              type: 'documents/createDocument/fulfilled',
              payload: newDoc,
            });
            expect(state.docCreateResult).toEqual(newDoc);
            expect(state.error).toBeNull(); // Error cleared
            expect(state.docs).toEqual(docs); // Previous data still preserved

            // Successful edit
            state = documentsReducer(state, {
              type: 'documents/editDocument/pending',
            });
            state = documentsReducer(state, {
              type: 'documents/editDocument/fulfilled',
              payload: { data: updatedDoc, statusCode: 200 },
            });
            expect(state.docEditResult.data).toEqual(updatedDoc);
            expect(state.docCreateResult).toEqual(newDoc); // Previous results preserved
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Async thunk state transitions', () => {
    it('should always transition from pending to either fulfilled or rejected', () => {
      fc.assert(
        fc.property(
          fc.oneof(documentArb, fc.string({ minLength: 1 })),
          (payloadOrError) => {
            let state = documentsReducer(undefined, {});

            // Start with pending
            state = documentsReducer(state, {
              type: 'documents/fetchDocument/pending',
            });
            expect(state.loading).toBe(true);

            // Must end in either fulfilled or rejected
            if (typeof payloadOrError === 'string') {
              // Rejected
              state = documentsReducer(state, {
                type: 'documents/fetchDocument/rejected',
                payload: payloadOrError,
              });
              expect(state.loading).toBe(false);
              expect(state.error).toBe(payloadOrError);
            } else {
              // Fulfilled
              state = documentsReducer(state, {
                type: 'documents/fetchDocument/fulfilled',
                payload: payloadOrError,
              });
              expect(state.loading).toBe(false);
              expect(state.doc).toEqual(payloadOrError);
              expect(state.error).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid successive operations correctly', () => {
      fc.assert(
        fc.property(
          fc.array(documentArb, { minLength: 2, maxLength: 5 }),
          (docs) => {
            let state = documentsReducer(undefined, {});

            // Simulate rapid successive fetches
            for (const doc of docs) {
              state = documentsReducer(state, {
                type: 'documents/fetchDocument/pending',
              });
              expect(state.loading).toBe(true);

              state = documentsReducer(state, {
                type: 'documents/fetchDocument/fulfilled',
                payload: doc,
              });
              expect(state.loading).toBe(false);
              expect(state.doc).toEqual(doc);
            }

            // Final state should have the last document
            expect(state.doc).toEqual(docs[docs.length - 1]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
