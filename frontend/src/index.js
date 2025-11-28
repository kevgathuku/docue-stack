import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { thunk } from 'redux-thunk';
import { applyMiddleware, createStore, compose } from 'redux';
import { Provider } from 'react-redux';
import reducer from './stores/reducer';
import * as serviceWorker from './serviceWorker';

import Auth from './components/Auth/Auth.jsx';
import Admin from './components/Admin/Admin.jsx';
import CreateDocument from './components/CreateDocument/index.jsx';
import CreateRole from './components/CreateRole/CreateRole.jsx';
import DocumentPage from './components/DocumentPage/index.jsx';
import Dashboard from './components/Dashboard/index.jsx';
import Landing from './components/Landing/Landing.jsx';
import Profile from './components/Profile/Profile.jsx';
import { DefaultLayout } from './components/Landing/Main.jsx';
import NotFound from './components/NotFound/NotFound.jsx';
import RolesAdmin from './components/RolesAdmin/RolesAdmin.jsx';
import UsersAdmin from './components/UsersAdmin/UsersAdmin.jsx';

import 'normalize.css/normalize.css';
import './styles/style.css';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducer, composeEnhancers(applyMiddleware(thunk)));

// React 18 root API
const container = document.getElementById('content');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <Router>
      <Routes>
        <Route path="/" element={<DefaultLayout component={Landing} />} />
        <Route path="/auth" element={<DefaultLayout component={Auth} />} />
        <Route path="/admin" element={<DefaultLayout component={Admin} />} />
        <Route path="/admin/roles" element={<DefaultLayout component={RolesAdmin} />} />
        <Route path="/admin/users" element={<DefaultLayout component={UsersAdmin} />} />
        <Route path="/admin/roles/create" element={<DefaultLayout component={CreateRole} />} />
        <Route path="/dashboard" element={<DefaultLayout component={Dashboard} />} />
        <Route path="/documents/create" element={<DefaultLayout component={CreateDocument} />} />
        <Route path="/documents/:id" element={<DefaultLayout component={DocumentPage} />} />
        <Route path="/profile" element={<DefaultLayout component={Profile} />} />
        <Route path="/404" element={<DefaultLayout component={NotFound} />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
