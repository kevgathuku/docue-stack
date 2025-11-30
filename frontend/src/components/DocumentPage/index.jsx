import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import swal from 'sweetalert';
import {
  deleteDocument,
  fetchDocument,
  selectDocDeleteResult,
  selectDocument,
} from '../../features/documents/documentsSlice';
import { fetchRoles, selectRoles } from '../../features/roles/rolesSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { withNavigate } from '../../utils/withNavigate';
import DocEdit from './DocEdit.jsx';

import 'sweetalert/dist/sweetalert.css';

const DocumentPage = ({ navigate, match }) => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDocument);
  const roles = useAppSelector(selectRoles);
  const deleteResult = useAppSelector(selectDocDeleteResult);

  const [parsedDate, setParsedDate] = useState(null);
  const [token] = useState(localStorage.getItem('user'));
  const [user] = useState(JSON.parse(localStorage.getItem('userInfo')));

  useEffect(() => {
    if (match?.params?.id && token) {
      dispatch(fetchDocument({ docId: match.params.id, token }));
      dispatch(fetchRoles(token));
    }
  }, [dispatch, match?.params?.id, token]);

  useEffect(() => {
    if (doc?.dateCreated) {
      const m = moment(new Date(doc.dateCreated));
      setParsedDate(m.fromNow());
    }
  }, [doc]);

  useEffect(() => {
    if (deleteResult && deleteResult.statusCode === 204) {
      swal('Deleted!', 'Your document has been deleted.', 'success');
      navigate('/dashboard');
    }
  }, [deleteResult, navigate]);

  const handleDocumentDelete = (docToDelete, event) => {
    // Prevent the default action for clicking on a link
    event.preventDefault();
    swal(
      {
        title: 'Are you sure?',
        text: 'You will not be able to recover this document!',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        closeOnConfirm: false,
      },
      () => {
        dispatch(deleteDocument({ docId: docToDelete._id, token }));
      }
    );
  };

  const handleDocumentEdit = (_docToEdit, event) => {
    // Prevent the default action for clicking on a link
    event.preventDefault();
    // Get the id of the <a> tag that triggered the modal
    const id = `#${event.currentTarget.getAttribute('href')}`;
    // Open the specific modal when the link is clicked
    window.$(id).openModal();
  };

  const onEditUpdate = (_updatedDoc) => {
    // The doc will be updated via Redux state when the edit completes
    // This callback is kept for compatibility with DocEdit component
  };

  const owner = user && doc ? user._id === doc.ownerId._id : false;
  const ownerName = doc ? `${doc.ownerId.name.first} ${doc.ownerId.name.last}` : 'User';
  const docEdit =
    doc && roles && roles.length > 1 ? (
      <div id={`edit-modal-${doc._id}`} className="modal">
        <DocEdit doc={doc} roles={roles} updateDoc={onEditUpdate} />
      </div>
    ) : null;

  return (
    <div className="container">
      <div className="card-panel">
        <div className="row">
          <h2 className="header center-align"> {doc ? doc.title : 'title'} </h2>
          <h6 className="center">{parsedDate ? `${parsedDate} by ${ownerName}` : 'today'}</h6>
        </div>
        <div className="row">
          <div className="col s10 offset-s1">{doc ? doc.content : 'Loading...'}</div>
        </div>
      </div>
      {docEdit}
      <div className="fixed-action-btn" style={{ bottom: 45, right: 24 }}>
        <a className="btn-floating btn-large pink">
          <i className="material-icons">toc</i>
        </a>
        <ul>
          {
            /* If this user is the owner, display the delete button */
            owner ? (
              <li>
                <button
                  className="btn-floating tooltipped red"
                  data-position="left"
                  data-delay="50"
                  data-tooltip="Delete"
                  onClick={(e) => handleDocumentDelete(doc, e)}
                >
                  <i className="material-icons">delete</i>
                </button>
              </li>
            ) : null
          }
          <li>
            {doc ? (
              <a
                className="btn-floating tooltipped blue"
                data-position="left"
                data-delay="50"
                data-tooltip="Edit"
                href={`edit-modal-${doc._id}`}
                onClick={(e) => handleDocumentEdit(doc, e)}
              >
                <i className="material-icons">edit</i>
              </a>
            ) : null}
          </li>
        </ul>
      </div>
    </div>
  );
};

DocumentPage.propTypes = {
  navigate: PropTypes.func,
  match: PropTypes.object,
};

export default withNavigate(DocumentPage);
