import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  fetchDocuments,
  selectDocuments,
  selectDocumentsLoading,
  selectDocumentsError,
} from '../../features/documents/documentsSlice';
import DocList from './DocList.jsx';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const docs = useAppSelector(selectDocuments);
  const loading = useAppSelector(selectDocumentsLoading);
  const reduxError = useAppSelector(selectDocumentsError);

  useEffect(() => {
    // Get the token from localStorage
    const token = localStorage.getItem('user');
    
    if (token) {
      dispatch(fetchDocuments(token));
    }
  }, [dispatch]);

  const renderContent = () => {
    const token = localStorage.getItem('user');
    const error = !token ? 'No authentication token found' : reduxError;
    
    if (error) {
      return (
        <div className="container">
          <div className="row">
            <div className="col s12">
              <div className="card-panel red lighten-4">
                <span className="red-text text-darken-4">
                  <i className="material-icons left">error</i>
                  {error}
                </span>
              </div>
              <p className="center-align">
                <Link to="/auth" className="btn blue">
                  Go to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container">
        <div className="row">
          <h2 className="header center-align">All Documents</h2>
        </div>
        <div className="row">
          {loading ? <p>Loading...</p> : docs ? <DocList docs={docs} /> : <p>Loading...</p>}
        </div>
        <div className="fixed-action-btn" style={{bottom: 45, right: 24}}>
          <Link
            className="btn-floating btn-large tooltipped pink"
            data-delay="50"
            data-position="left"
            data-tooltip="Create Document"
            to="/documents/create"
          >
            <i className="material-icons">add</i>
          </Link>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default Dashboard;
