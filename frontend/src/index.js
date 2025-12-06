import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import { store } from './store';

import Admin from './components/Admin/Admin.res.js';
import Auth from './components/Auth/Auth.jsx';
import CreateDocument from './components/CreateDocument/index.jsx';
import CreateRole from './components/CreateRole/CreateRole.res.js';
import Dashboard from './components/Dashboard/index.jsx';
import DocumentPage from './components/DocumentPage/index.jsx';
import Landing from './components/Landing/Landing.res.js';
import { DefaultLayout } from './components/Landing/Main.jsx';
import NotFound from './components/NotFound/NotFound.res.js';
import PrivateRoute from './components/PrivateRoute.jsx';
import Profile from './components/Profile/Profile.res.js';
import RolesAdmin from './components/RolesAdmin/RolesAdminContainer.jsx';
import UsersAdmin from './components/UsersAdmin/UsersAdmin.jsx';

import 'normalize.css/normalize.css';
import './styles/style.css';

// Redux store is configured with Redux Toolkit's configureStore
// Redux DevTools Extension is enabled in development (see store/index.js)

// React 18 root API
const container = document.getElementById('content');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<DefaultLayout component={Landing} />} />
        <Route path="/auth" element={<DefaultLayout component={Auth} />} />
        <Route path="/404" element={<DefaultLayout component={NotFound} />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DefaultLayout component={Dashboard} />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <DefaultLayout component={Profile} />
            </PrivateRoute>
          }
        />
        <Route
          path="/documents/create"
          element={
            <PrivateRoute>
              <DefaultLayout component={CreateDocument} />
            </PrivateRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <PrivateRoute>
              <DefaultLayout component={DocumentPage} />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <DefaultLayout component={Admin} />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <PrivateRoute>
              <DefaultLayout component={RolesAdmin} />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <DefaultLayout component={UsersAdmin} />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/roles/create"
          element={
            <PrivateRoute>
              <DefaultLayout component={CreateRole} />
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to 404 */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
