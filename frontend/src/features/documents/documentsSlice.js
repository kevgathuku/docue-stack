import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import request from 'superagent';
import { BASE_URL } from '../../config/api.js';

// Initial state matching the DocStore structure
const initialState = {
  doc: null,
  docs: null,
  docCreateResult: null,
  docDeleteResult: null,
  docEditResult: null,
  loading: false,
  error: null,
};

// Async thunks for document operations

/**
 * Fetch all documents for the current user
 */
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (token, { rejectWithValue }) => {
    try {
      const result = await request
        .get(`${BASE_URL}/api/documents`)
        .set('x-access-token', token);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Fetch a single document by ID
 */
export const fetchDocument = createAsyncThunk(
  'documents/fetchDocument',
  async ({ docId, token }, { rejectWithValue }) => {
    try {
      const result = await request
        .get(`${BASE_URL}/api/documents/${docId}`)
        .set('x-access-token', token);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Create a new document
 */
export const createDocument = createAsyncThunk(
  'documents/createDocument',
  async ({ body, token }, { rejectWithValue }) => {
    try {
      const result = await request
        .post(`${BASE_URL}/api/documents`)
        .set('x-access-token', token)
        .send(body);
      return result.body;
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Edit an existing document
 */
export const editDocument = createAsyncThunk(
  'documents/editDocument',
  async ({ docId, updatedDoc, token }, { rejectWithValue }) => {
    try {
      const result = await request
        .put(`${BASE_URL}/api/documents/${docId}`)
        .set('x-access-token', token)
        .send(updatedDoc);
      return {
        data: result.body,
        statusCode: result.statusCode,
      };
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

/**
 * Delete a document
 */
export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async ({ docId, token }, { rejectWithValue }) => {
    try {
      const result = await request
        .delete(`${BASE_URL}/api/documents/${docId}`)
        .set('x-access-token', token);
      return {
        data: result.body,
        statusCode: result.statusCode,
      };
    } catch (err) {
      return rejectWithValue(err.response?.body?.error || err.message);
    }
  }
);

// Documents slice
const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Synchronous actions can be added here if needed
  },
  extraReducers: (builder) => {
    // Fetch documents
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.docs = action.payload;
        state.error = null;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single document
    builder
      .addCase(fetchDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.doc = action.payload;
        state.error = null;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create document
    builder
      .addCase(createDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.docCreateResult = action.payload;
        state.error = null;
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Edit document
    builder
      .addCase(editDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.docEditResult = action.payload;
        state.error = null;
      })
      .addCase(editDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete document
    builder
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.docDeleteResult = action.payload;
        state.error = null;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions (currently none, but structure is ready)
export const {} = documentsSlice.actions;

// Selectors
export const selectDocuments = (state) => state.documents.docs;
export const selectDocument = (state) => state.documents.doc;
export const selectDocCreateResult = (state) => state.documents.docCreateResult;
export const selectDocEditResult = (state) => state.documents.docEditResult;
export const selectDocDeleteResult = (state) => state.documents.docDeleteResult;
export const selectDocumentsLoading = (state) => state.documents.loading;
export const selectDocumentsError = (state) => state.documents.error;

// Export reducer
export default documentsSlice.reducer;
